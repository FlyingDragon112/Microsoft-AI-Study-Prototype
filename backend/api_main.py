from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from Speech import recognize_from_microphone, convert_text_to_speech
from fastapi import Request
from openai import OpenAI

endpoint = "https://firsttimerschat1.openai.azure.com/openai/v1"
deployment_name = "gpt-4.1-nano"
api_key = "BKODepscxWslIBsfK9Ty9sBR6Vvrhj4CziEHmeEG1OkzkUoaIZ41JQQJ99CCACqBBLyXJ3w3AAABACOG34DF"

client = OpenAI(
    base_url=endpoint,
    api_key=api_key
)

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

SYSTEM_PROMPT = (
    "You are a helpful math tutor. When explaining solutions, "
    "format your response in plain text. Do NOT use LaTeX, dollar signs ($), "
    "\\boxed{}, or any math markup. Use simple notation like: "
    "x^2 for exponents, sqrt() for square roots, and write fractions as a/b. "
    "Use clear step-by-step formatting with numbered steps."
    "Clearly mark end of lines with '\n'"   
)

@app.post("/chat/")
async def chat(request: ChatRequest):
    context_window.add_message(f"User: {request.query}")
    context = context_window.get_context()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    for msg in context_window.messages:
        if msg.startswith("User: "):
            messages.append({"role": "user", "content": msg[len("User: "):]})
        elif msg.startswith("Bot: "):
            messages.append({"role": "assistant", "content": msg[len("Bot: "):]})
    response_obj = client.chat.completions.create(
        model = "gpt-4.1-nano",
        messages=messages
    )
    # Extract the response text (adjust if API response structure differs)
    response_text = response_obj.choices[0].message.content if hasattr(response_obj, 'choices') else str(response_obj)
    context_window.add_message(f"Bot: {response_text}")
    return {"query": request.query, "response": response_text, "context": context}

# @app.post("/chat/")
# async def chat(request: ChatRequest):
#     context_window.add_message(f"User: {request.query}")
#     # Pass context to LLM if needed
#     context = context_window.get_context()
#     response = llm.invoke(context)
#     context_window.add_message(f"Bot: {response}")
#     return {"query": request.query, "response": response, "context": context}

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