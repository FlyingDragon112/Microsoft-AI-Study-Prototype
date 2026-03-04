from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from main_architecture import get_document_text, llm
from pydantic import BaseModel
from Speech import recognize_from_microphone, convert_text_to_speech
from fastapi import Request

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/analyze-document/")
async def analyze_document(file: UploadFile = File(...)):
    file_location = f"Docs/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
    text = get_document_text(file_location)
    return {"filename": file.filename, "text": text}

class ChatRequest(BaseModel):
    query: str

class ContextWindow:
    def __init__(self, size=5):
        self.size = size
        self.messages = []

    def add_message(self, message):
        self.messages.append(message)
        if len(self.messages) > self.size:
            self.messages.pop(0)

    def get_context(self):
        return "\n".join(self.messages)

context_window = ContextWindow(size=50)

@app.post("/chat/")
async def chat(request: ChatRequest):
    context_window.add_message(f"User: {request.query}")
    # Pass context to LLM if needed
    context = context_window.get_context()
    response = llm.invoke(context)
    context_window.add_message(f"Bot: {response}")
    return {"query": request.query, "response": response, "context": context}

@app.post("/speech-to-text/")
async def speech_to_text():
    text = recognize_from_microphone()
    return {"text": text}

@app.post("/text-to-speech/")
async def text_to_speech(request: Request):
    data = await request.json()
    text = data.get("text", "")
    convert_text_to_speech(text)
    return {"status": "ok"}