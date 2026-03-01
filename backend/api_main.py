from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from main_architecture import get_document_text, llm

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your frontend URL
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

from pydantic import BaseModel

class ChatRequest(BaseModel):
    query: str

@app.post("/chat/")
async def chat(request: ChatRequest):
    response = llm.invoke(request.query)
    return {"query": request.query, "response": response}
