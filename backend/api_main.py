from fastapi import FastAPI, UploadFile, File
from dotenv import load_dotenv
import os
from main_architecture import get_document_text, llm

load_dotenv()
app = FastAPI()

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

@app.post("/chat/")
async def chat(query: str):
    response = llm.invoke(query)
    return {"query": query, "response": response}
