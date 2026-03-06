from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from Speech import recognize_from_microphone, convert_text_to_speech
from fastapi import Request
from openai import OpenAI
from fastapi import HTTPException
import shutil
from typing import List
import base64
from mimetypes import guess_type

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

if os.path.exists("uploads"):
    shutil.rmtree("uploads")
os.makedirs("uploads", exist_ok=True)

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
    "You are a helpful tutor specialising in Math, Physics and Chemistry. When explaining solutions, "
    "format your response in plain text. Do NOT use LaTeX, dollar signs ($), "
    "\\boxed{}, or any math markup. Use simple notation like: "
    "x^2 for exponents, sqrt() for square roots, and write fractions as a/b. "
    "Use clear step-by-step formatting with numbered steps."
    "Clearly mark end of lines with '\n'"   
)
@app.post("/chat/")
async def chat(request: ChatRequest):
    try:
        context_window.add_message(f"User: {request.query}")
        context = context_window.get_context()

        # Fetch ticked files
        ticked_files_response = await get_ticked_files()
        ticked_files = ticked_files_response["ticked_files"]

        # Filter for image files
        image_files = [file for file in ticked_files if file.lower().endswith((".jpg", ".jpeg", ".png", ".gif"))]

        # Construct the content with user query and images
        content = [
            {"type": "text", "text": request.query}
        ]

        for image in image_files:
            image_path = f"uploads/{image}"
            data_url = local_image_to_data_url(image_path)
            content.append({"type": "image_url", "image_url": {"url": data_url}})
        print(content)

        # Call get_single_question if ticked_files is not empty
        single_question_response = None
        if ticked_files:
            single_question_response = await get_single_question(content)
        print("worked till here")
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content}
        ]

        response_obj = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=messages,
            max_tokens=2000
        )

        response_text = response_obj.choices[0].message.content if hasattr(response_obj, 'choices') else str(response_obj)
        context_window.add_message(f"Bot: {response_text}")

        # Combine the LLM response with the single question response if available
        if single_question_response:
            response_text += f"\n\nAdditional Question:\n{single_question_response['response']}"

        print({"query": request.query, "response": response_text, "context": context})
        return {"query": request.query, "response": response_text, "context": context}
    except Exception as e:
        # Log the error for debugging
        print(f"Error in /chat/ endpoint: {e}")

        # Return a 500 Internal Server Error response
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# @app.post("/chat/")
# async def chat(request: ChatRequest):
#     context_window.add_message(f"User: {request.query}")
#     context = context_window.get_context()

#     # Fetch ticked files
#     ticked_files_response = await get_ticked_files()
#     ticked_files = ticked_files_response["ticked_files"]

#     # Filter for image files
#     image_files = [file for file in ticked_files if file.lower().endswith((".jpg", ".jpeg", ".png", ".gif"))]

#     # Construct the content with user query and images
#     content = [
#         {"type": "text", "text": request.query}
#     ]

#     for image in image_files:
#         image_path = f"uploads/{image}"
#         data_url = local_image_to_data_url(image_path)
#         content.append({"type": "image_url", "image_url": {"url": data_url}})

#     messages = [
#         {"role": "system", "content": SYSTEM_PROMPT},
#         {"role": "user", "content": content}
#     ]

#     response_obj = client.chat.completions.create(
#         model="gpt-4.1-nano",
#         messages=messages,
#         max_tokens=2000
#     )

#     response_text = response_obj.choices[0].message.content if hasattr(response_obj, 'choices') else str(response_obj)
#     context_window.add_message(f"Bot: {response_text}")
#     return {"query": request.query, "response": response_text, "context": context}

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
    language = data.get("language", "en-US")
    convert_text_to_speech(text, language)
    return {"status": "ok"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        return {"filename": file.filename, "status": "uploaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

class TickedFiles(BaseModel):
    ticked_files: List[str]

# Store ticked files in memory for simplicity
ticked_files_store = []

@app.post("/ticked-files/")
async def update_ticked_files(ticked_files: TickedFiles):
    global ticked_files_store
    ticked_files_store = ticked_files.ticked_files
    print(ticked_files_store)
    return {"status": "updated", "ticked_files": ticked_files_store}

@app.get("/ticked-files/")
async def get_ticked_files():
    print(ticked_files_store)
    return {"ticked_files": ticked_files_store}

# Function to encode a local image into data URL
def local_image_to_data_url(image_path):
    mime_type, _ = guess_type(image_path)
    if mime_type is None:
        mime_type = 'application/octet-stream' 

    with open(image_path, "rb") as image_file:
        base64_encoded_data = base64.b64encode(image_file.read()).decode('utf-8')

    return f"data:{mime_type};base64,{base64_encoded_data}"


from sentence_transformers import SentenceTransformer
import faiss
import json 
model = SentenceTransformer('multi-qa-mpnet-base-dot-v1')  # Same model used for embeddings
index = faiss.read_index(r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\faiss_index.bin")
with open(r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\metadata.json", "r") as f:
    metadata = json.load(f)

@app.post("/get-single-question/")
async def get_single_question(content: List[dict]):
    """
    Endpoint to get a single question based on the user's query and images.
    """
    # Construct the context from content (text and images)
    context_parts = []
    for item in content:
        if item["type"] == "text":
            context_parts.append(f"User Query: {item['text']}")
        elif item["type"] == "image_url":
            context_parts.append(f"Image Context: {item['image_url']['url']}")

    # Combine all parts into a single context string
    combined_context = "\n".join(context_parts)

    try:
        # Generate embeddings for the combined context
        query_embedding = model.encode([combined_context])
        distances, indices = index.search(query_embedding,3)
        results = [metadata[i] for i in indices[0]]

        # Format the retrieved questions
        context = "\n".join([f"Q: {result['question']}" for result in results])
        SYSTEM_PROMPT = """You are a helpful assistant that provides similar questions based on the user's query and images.
        Give ONLY ONE Question in the following format:
        Examination and Year of Question - 
        Topics - 
        Question - 
        Options - 
        a)
        b)
        c)
        d)
        ENSURE NO FIELD IS LEFT EMPTY
        """
        content_message = f"Here are some questions similar to the user's query and images:\n{context}\n\nPlease provide a list of these questions in a user-friendly format."
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content_message}
        ]

        response_obj = client.chat.completions.create(
            model=deployment_name,
            messages=messages,
            max_tokens=2000
        )

        response_text = response_obj.choices[0].message.content
        return {"context": combined_context, "response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")