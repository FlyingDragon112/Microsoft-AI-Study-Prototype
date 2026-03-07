from fastapi import FastAPI, UploadFile, File, Query
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
SYSTEM_PROMPT2 = (
    "You are a helpful tutor specialising in Math, Physics and Chemistry. When explaining solutions, "
    "format your response in plain text. Do NOT use LaTeX, dollar signs ($), "
    "\\boxed{}, or any math markup. Use simple notation like: "
    "x² for exponents, fractions should look like fractions and not a/b. "
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
            {"role": "system", "content": SYSTEM_PROMPT2},
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

# @app.post("/get-single-question/")
# async def get_single_question(content: List[dict]):
#     """
#     Endpoint to get a single question based on the user's query and images.
#     """
#     # Construct the context from content (text and images)
#     context_parts = []
#     for item in content:
#         if item["type"] == "text":
#             context_parts.append(f"User Query: {item['text']}")
#         elif item["type"] == "image_url":
#             context_parts.append(f"Image Context: {item['image_url']['url']}")

#     # Combine all parts into a single context string
#     combined_context = "\n".join(context_parts)

#     try:
#         # Generate embeddings for the combined context
#         query_embedding = model.encode([combined_context])
#         distances, indices = index.search(query_embedding,3)
#         results = [metadata[i] for i in indices[0]]

#         # Format the retrieved questions
#         context = "\n".join([f"Q: {result['question']}" for result in results])
#         SYSTEM_PROMPT = """You are a helpful assistant that provides similar questions based on the user's query and images.
#         It is IMPORTANT that the question has same subject as the user query and similar topics.
#         Give ONLY ONE Question in the following format:
#         Examination and Year of Question - 
#         Topics - 
#         Question - 
#         Options - 
#         a)
#         b)
#         c)
#         d)
#         ENSURE NO FIELD IS LEFT EMPTY
#         """
#         content_message = f"Here are some questions similar to the user's query and images:\n{context}\n\nPlease provide a list of these questions in a user-friendly format."
#         messages = [
#             {"role": "system", "content": SYSTEM_PROMPT},
#             {"role": "user", "content": content_message}
#         ]

#         response_obj = client.chat.completions.create(
#             model=deployment_name,
#             messages=messages,
#             max_tokens=2000
#         )

#         response_text = response_obj.choices[0].message.content
#         response_obj = client.chat.completions.create(
#             model=deployment_name,
#             messages=[
#                 {"role":"system","content":"check if {response_text} has all values filled."
#                 "ensure there are line endings as '\n'. "
#                 "Respond as 1 if all fields are filled"
#                 "Respond as 0 if few field are not filled"}
#             ],
#             max_tokens=2000
#         )
#         if "1" in response_obj.choices[0].message.content:
#             return {"context": combined_context, "response": response_text}
#         else:
#             return get_single_question(content)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/get-single-question/")
async def get_single_question(content: List[dict], depth: int = 0):
    """
    Endpoint to get a single question based on the user's query and images.
    """
    # Check if recursion depth exceeds 4
    if depth > 4:
        raise HTTPException(status_code=500, detail="Maximum recursion depth exceeded")

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
        distances, indices = index.search(query_embedding, 5)
        results = [metadata[i] for i in indices[0]]

        # Format the retrieved questions
        context = "\n".join([f"Q: {result['question']}" for result in results])
        SYSTEM_PROMPT = """You are a helpful assistant tasked with providing a question similar to the user's query and images.
        Your responsibilities include:
        1. Classify the user's query and images into one of the following subjects: Physics, Chemistry, or Math.
        2. Ensure that the subject of the provided question matches the subject of the user's query.
        3. Provide ONLY ONE question in the following structured format:
        - Examination and Year of Question:
        - Topics:
        - Question:
        - Options:
            a)
            b)
            c)
            d)

        IMPORTANT:
        - Ensure that the subject of the question is the same as the subject of the user's query.
        - Ensure that all fields are filled and no field is left empty.
        - Use clear and concise language.
        - Maintain proper line endings using '\\n' to separate fields.
        """
        content_message = f"This is user query and image:\n{context}."
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
        response_obj = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": f"check if {response_text} has all values filled."
                 "ensure there are line endings as '\\n'. "
                 "Respond as 1 if all fields are filled"
                 "Respond as 0 if few field are not filled"}
            ],
            max_tokens=2000
        )
        if "1" in response_obj.choices[0].message.content:
            return {"context": combined_context, "response": response_text}
        else:
            # Increment the depth and call the function recursively
            return await get_single_question(content, depth=depth + 1)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

import pandas as pd
data = pd.read_csv(os.path.join(os.path.dirname(__file__), "data", "data_jee.csv"))

@app.post("/get-quiz-questions/")
async def get_quiz_questions(num_ques: int, subjects: List[str] = Query(None), topics: List[str] = Query(None)):
    # Subjects: physics, chemistry, maths
    print(subjects)
    filtered = data.copy()
    if subjects == []:
        subjects = ['physics','chemistry','maths']
    # Filter by subjects if provided
    filtered = filtered[filtered["subject"].str.lower().isin([s.lower() for s in subjects])]

    subject_groups = filtered.groupby("subject")
    num_subjects = len(subject_groups)
    base_per_subject = num_ques // num_subjects
    remainder = num_ques % num_subjects

    sampled_frames = []
    for i, (subject, group) in enumerate(subject_groups):
        # Give one extra question to the first `remainder` subjects
        n = base_per_subject + (1 if i < remainder else 0)
        n = min(n, len(group))  # can't sample more than available
        sampled_frames.append(group.sample(n=n))

    result = pd.concat(sampled_frames).sample(frac=1).reset_index(drop=True)  # shuffle

    # Return as list of dicts
    questions = []
    for _, row in result.iterrows():
        options = row["options"]
        if isinstance(options, str):
            try:
                options = eval(options)
            except Exception:
                pass
        # Map options list into individual optionA/B/C/D fields
        options_map = {}
        if isinstance(options, list):
            for opt in options:
                if isinstance(opt, dict):
                    identifier = opt.get("identifier", "").upper()
                    options_map[f"option{identifier}"] = opt.get("content", "")

        questions.append({
            "subject": row["subject"],
            "chapter": row.get("chapter", ""),
            "topic": row.get("topic", ""),
            "question": row["question"],
            "optionA": options_map.get("optionA", ""),
            "optionB": options_map.get("optionB", ""),
            "optionC": options_map.get("optionC", ""),
            "optionD": options_map.get("optionD", ""),
            "correct_option": row.get("correct_option", ""),
            "explanation": row.get("explanation", ""),
            "paper_id": row.get("paper_id", ""),
        })

    return questions