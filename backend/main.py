import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

# Add FFmpeg to PATH (installed via Winget)
ffmpeg_path = r"C:\Users\rites\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin"
if os.path.exists(ffmpeg_path):
    os.environ["PATH"] += os.pathsep + ffmpeg_path


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService
import pyttsx3 # Add import
import shutil
from agent import root_agent

app = FastAPI(title="CryptoAI Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ADK Services
session_service = InMemorySessionService()
artifact_service = InMemoryArtifactService()

# Initialize Runner
# adk web runs automatically, but for Custom API we need manual runner
runner = Runner(
    agent=root_agent,
    app_name="CryptoBackend",
    session_service=session_service,
    artifact_service=artifact_service
)

from google.genai import types
try:
    import rag_service
except ImportError:
    from . import rag_service

# Initialize RAG (Vector DB)
# Initialize RAG (Vector DB)
# Lazy load instead of global init to save memory on 512MB instances
# rag_service.initialize_rag()

@app.get("/")
def health_check():
    return {"status": "ok", "agent": root_agent.name}

# --- Voice Integration ---
import whisper
import shutil
import tempfile
from fastapi import WebSocket, WebSocketDisconnect
import base64
import json
import re
import time
import pyttsx3
try:
    import pythoncom  # Required for threading on Windows
except ImportError:
    pythoncom = None

# Load Whisper model (lazy load or on startup)
# Using "tiny" model for maximum speed.
# Load Whisper model (lazy load or on startup)
# Using "tiny" model for maximum speed.
# audio_model = whisper.load_model("tiny")
_audio_model_cache = None

def get_audio_model():
    global _audio_model_cache
    if _audio_model_cache is None:
        print("Loading Whisper model (Lazy)...")
        _audio_model_cache = whisper.load_model("tiny")
        print("Whisper model loaded.")
    return _audio_model_cache


def generate_voice(text, output_file):
    # Initialize engine in the thread
    if pythoncom:
        pythoncom.CoInitialize()
    try:
        engine = pyttsx3.init()
        # Optional: Set properties (rate, volume, voice)
        engine.setProperty('rate', 175) # Speed up a bit
        
        # Select a nice voice if available (e.g., Zira on Windows)
        voices = engine.getProperty('voices')
        for voice in voices:
            if "Zira" in voice.name:
                engine.setProperty('voice', voice.id)
                break
                
        engine.save_to_file(text, output_file)
        engine.runAndWait()
    finally:
        if pythoncom:
            pythoncom.CoUninitialize()

# --- WebSocket Streaming ---

@app.websocket("/ws/chat/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    print(f"Client {client_id} connected")
    
    # Audio buffer for STT
    audio_buffer = bytearray()
    last_transcribe_time = time.time()
    
    try:
        while True:
            # We expect either bytes (audio) or text (control/json)
            message = await websocket.receive()
            
            if "bytes" in message and message["bytes"]:
                # Append audio chunk
                audio_buffer.extend(message["bytes"])
                
                # Partial Transcription (every 1.5s)
                if len(audio_buffer) > 32000 and (time.time() - last_transcribe_time) > 1.5:
                     last_transcribe_time = time.time()
                     
                     # Async transcribe
                     # We create a copy to avoid threading issues if buffer changes (though we're awaiting so it's safer)
                     curr_buffer = audio_buffer[:]
                     
                     async def partial_stt():
                         with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_p:
                             temp_p.write(curr_buffer)
                             temp_p_path = temp_p.name
                         try:
                             # Use beam_size=1 and fast decode for partial
                             model = get_audio_model()
                             res = await asyncio.to_thread(model.transcribe, temp_p_path, fp16=False, language="en")
                             return res["text"].strip()
                         finally:
                             if os.path.exists(temp_p_path): os.remove(temp_p_path)
                     
                     # Run without blocking the loop too much (fire and await)
                     partial_text = await partial_stt()
                     if partial_text:
                         await websocket.send_json({"type": "transcript_partial", "text": partial_text})

            elif "text" in message and message["text"]:
                data = json.loads(message["text"])
                msg_type = data.get("type")
                
                if msg_type == "transcribe_request":
                    # User stopped speaking, process buffer
                    if len(audio_buffer) > 0:
                        # Save buffer to temp wav
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_in:
                             temp_in.write(audio_buffer)
                             temp_in_path = temp_in.name
                        
                        # Transcribe
                        try:
                            # Note: Whisper needs ffmpeg to read .webm/bytes
                            # Force English to prevent random language hallucinations
                            model = get_audio_model()
                            res = model.transcribe(temp_in_path, language="en")
                            user_text = res["text"].strip()
                            
                            # Hallucination Filtering
                            # Common phrases Whisper outputs on silence
                            hallucinations = [
                                "Thank you for watching", "Subtitle by", "Amara.org", "MBC", 
                                "Copyright", "All rights reserverd", "Unidentified", "The end"
                            ]
                            
                            is_hallucination = any(h.lower() in user_text.lower() for h in hallucinations)
                            
                            # Validation: Ignore empty, short, or blacklisted input
                            if not user_text or len(user_text) < 2 or is_hallucination:
                                print(f"Ignored invalid transcription: '{user_text}'")
                                audio_buffer = bytearray()
                                continue
                            
                            # Send Transcript back
                            await websocket.send_json({"type": "transcript", "text": user_text})
                            
                            # Agent Processing and Streaming Response
                            response_text = ""
                            sentence_buffer = ""
                            
                            # Check session
                            session = await session_service.get_session(app_name="CryptoBackend", user_id="user", session_id=client_id)
                            if not session:
                                await session_service.create_session(app_name="CryptoBackend", user_id="user", session_id=client_id)

                            chunk_index = 0
                            
                            async for event in runner.run_async(
                                user_id="user",
                                session_id=client_id,
                                new_message=types.Content(role="user", parts=[types.Part(text=user_text)])
                            ):
                                  # Robust Event Parsing
                                  chunk_text = ""
                                  if hasattr(event, 'text') and event.text:
                                      chunk_text = event.text
                                  elif hasattr(event, 'content') and event.content:
                                      if hasattr(event.content, 'parts'):
                                          for part in event.content.parts:
                                              if hasattr(part, 'text') and part.text:
                                                  chunk_text += part.text
                                      elif hasattr(event.content, 'text') and event.content.text:
                                          chunk_text = event.content.text
                                  
                                  if chunk_text:
                                      print(f"DEBUG CHUNK: '{chunk_text}'") # DEBUG
                                      response_text += chunk_text
                                      sentence_buffer += chunk_text
                                      await websocket.send_json({"type": "response.text_partial", "text": chunk_text})
                                      
                                      # Check for sentence delimiters
                                      # Simple regex for . ! ? followed by space or end
                                      # We use non-consuming lookbehind to avoid eating the punctuation
                                      sentences = re.split(r'(?<=[.!?])\s+', sentence_buffer)
                                      
                                      # If we have more than 1 part, the first parts are complete sentences
                                      if len(sentences) > 1:
                                          # Process all except the last incomplete buffer
                                          complete_sentences = sentences[:-1]
                                          sentence_buffer = sentences[-1] # Keep the rest
                                          
                                          for sentence in complete_sentences:
                                              if not sentence.strip(): continue
                                              
                                              # Generate Audio for sentence
                                              with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
                                                  temp_voice_path = fp.name
                                                  
                                              await asyncio.to_thread(generate_voice, sentence, temp_voice_path)
                                              
                                              with open(temp_voice_path, "rb") as audio_file:
                                                  audio_chunk = audio_file.read()
                                                  b64_audio = base64.b64encode(audio_chunk).decode('utf-8')
                                                  await websocket.send_json({
                                                      "type": "response.audio", 
                                                      "data": b64_audio, 
                                                      "index": chunk_index,
                                                      "final": False
                                                  })
                                                  chunk_index += 1
                                              
                                              if os.path.exists(temp_voice_path): os.remove(temp_voice_path)

                            # Send Final Text
                            await websocket.send_json({"type": "response.text", "text": response_text})
                            
                            # Process any remaining buffer as the final sentence
                            if sentence_buffer.strip():
                                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
                                    temp_voice_path = fp.name
                                    
                                await asyncio.to_thread(generate_voice, sentence_buffer, temp_voice_path)
                                
                                with open(temp_voice_path, "rb") as audio_file:
                                    audio_chunk = audio_file.read()
                                    b64_audio = base64.b64encode(audio_chunk).decode('utf-8')
                                    await websocket.send_json({
                                        "type": "response.audio", 
                                        "data": b64_audio, 
                                        "index": chunk_index,
                                        "final": True
                                    })
                                if os.path.exists(temp_voice_path): os.remove(temp_voice_path)

                        except Exception as e:
                            print(f"Error processing: {e}")
                            await websocket.send_json({"type": "error", "message": str(e)})
                        finally:
                            # Cleanup input
                            audio_buffer = bytearray()
                            if os.path.exists(temp_in_path): os.remove(temp_in_path)

                elif msg_type == "text_input":
                     user_text = data.get("text", "")
                     
                     # 1. Echo user text back (to confirm receipt/display)
                     await websocket.send_json({"type": "transcript", "text": user_text})
                     
                     # 2. Agent Processing
                     response_text = ""
                     
                     # Check session
                     session = await session_service.get_session(app_name="CryptoBackend", user_id="user", session_id=client_id)
                     if not session:
                         await session_service.create_session(app_name="CryptoBackend", user_id="user", session_id=client_id)
                     
                     try:
                         print("Running agent (Text Mode)...") # DEBUG
                         async for event in runner.run_async(
                             user_id="user",
                             session_id=client_id,
                             new_message=types.Content(role="user", parts=[types.Part(text=user_text)])
                         ):
                               # DEBUG: See what event we actually get
                               print(f"DEBUG EVENT: {type(event)}")
                               # Robust Event Parsing
                               chunk_text = ""
                               if hasattr(event, 'text') and event.text:
                                   chunk_text = event.text
                               elif hasattr(event, 'content') and event.content:
                                   if hasattr(event.content, 'parts'):
                                       for part in event.content.parts:
                                           if hasattr(part, 'text') and part.text:
                                               chunk_text += part.text
                                   elif hasattr(event.content, 'text') and event.content.text:
                                       chunk_text = event.content.text
                               
                               print(f"Chunk: {chunk_text}") # DEBUG
                               
                               if chunk_text:
                                   response_text += chunk_text
                                   await websocket.send_json({"type": "response.text_partial", "text": chunk_text})
                         
                         print(f"Agent Reply (Text): {response_text}") # DEBUG
                         # Send Final Text
                         await websocket.send_json({"type": "response.text", "text": response_text})
                         
                         # NO TTS for text input
                         
                     except Exception as e:
                         print(f"Error processing text: {e}")
                         await websocket.send_json({"type": "error", "message": str(e)})

                elif msg_type == "stop":
                     # Client interrupted, stop everything
                     print("Received stop signal") # DEBUG
                     audio_buffer = bytearray()
                     pass
                     
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")
    except RuntimeError as e:
        # Starlette sometimes raises RuntimeError if receive is called after disconnect
        if "disconnect" in str(e).lower():
             print(f"Client {client_id} disconnected (RuntimeError)")
        else:
             print(f"RuntimeError in websocket: {e}")
    except Exception as e:
        print(f"Unexpected error in websocket: {e}")

