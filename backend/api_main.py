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

# Load Model
endpoint = "https://firsttimerschat1.openai.azure.com/openai/v1"
deployment_name = "gpt-4.1-nano"
api_key = "BKODepscxWslIBsfK9Ty9sBR6Vvrhj4CziEHmeEG1OkzkUoaIZ41JQQJ99CCACqBBLyXJ3w3AAABACOG34DF"

client = OpenAI(
    base_url=endpoint,
    api_key=api_key
)

# Setup FastAPI
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cleanup Uploads Folder
if os.path.exists("uploads"):
    shutil.rmtree("uploads")
os.makedirs("uploads", exist_ok=True)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Define Base Models
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

# Trial Prompts
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

# Chat Based APIs
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
            #single_question_response = await get_user_question_info(content)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT2},
            {"role": "user", "content": f"Previous conversation:\n{context}\n\nCurrent query:"},
            {"role": "user", "content": content}
        ]

        response_obj = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=messages,
            max_tokens=2000
        )

        response_text = response_obj.choices[0].message.content if hasattr(response_obj, 'choices') else str(response_obj)

        # Combine the LLM response with the single question response if available
        if single_question_response:
            sq = single_question_response['response']
            # Ensure each field starts on a new line
            for label in ["Examination and Year of Question:", "Topics:", "Question:", "Options:", "a)", "b)", "c)", "d)"]:
                sq = sq.replace(label, f"\n{label}")
            sq = sq.strip()
            response_text += f"\n\n---\n\n**Additional Question:**\n\n{sq}"

        context_window.add_message(f"Bot: {response_text}")

        print({"query": request.query, "response": response_text, "context": context})
        return {"query": request.query, "response": response_text, "context": context}
    except Exception as e:
        # Log the error for debugging
        print(f"Error in /chat/ endpoint: {e}")

        # Return a 500 Internal Server Error response
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Speech Related APIs
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

# Upload File
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

# Get Information Related to Context Files
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

# Quiz
# Load the Model
from sentence_transformers import SentenceTransformer
import faiss
import json 
model = SentenceTransformer('multi-qa-mpnet-base-dot-v1')  # Same model used for embeddings
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
faiss_index_path = os.path.join(BASE_DIR, "faiss_index.bin")
metadata_path = os.path.join(BASE_DIR, "metadata.json")
index = faiss.read_index(faiss_index_path)
with open(metadata_path, "r") as f:
    metadata = json.load(f)

import json as json_mod
SUBJECT_CHAPTERS_TOPICS_PATH = os.path.join(os.path.dirname(__file__), "data", "subject_chapters_topics.json")
with open(SUBJECT_CHAPTERS_TOPICS_PATH, "r", encoding="utf-8") as f:
    SUBJECT_CHAPTERS_TOPICS = json_mod.load(f)

def extract_subject_chapter_topics(content):
    """
    Use LLM to extract subject, chapter, and topics from user query and images.
    Returns: dict with keys 'subject', 'chapter', 'topics' (list)
    """
    context_parts = []
    for item in content:
        if item["type"] == "text":
            context_parts.append(f"User Query: {item['text']}")
        elif item["type"] == "image_url":
            context_parts.append(f"Image Context: {item['image_url']['url']}")
            
    combined_context = "\n".join(context_parts)
    system_prompt = (
        "You are an expert at classifying JEE/NEET exam questions into subject, chapter, and topics. "
        "You MUST use ONLY the exact values for subject, chapter, and topics from this JSON:"
        "Given the following user query and context, do the following:\n"
        "1. Identify the most likely subject (physics, chemistry, or maths) based on keywords in the query. "
        "2. Choose the most relevant chapter and topics for that subject, again using ONLY the allowed values.\n"
        "3. If the query is ambiguous, pick the most probable subject based on keywords, but NEVER guess randomly.\n"
        "4. Output STRICTLY as JSON: {\"subject\": ..., \"chapter\": ..., \"topics\": [...]}.\n"
        "5. If you cannot determine a chapter or topic, leave them as empty strings or empty lists, but NEVER invent new names.\n"
        "Now, classify the following query and context:"
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": combined_context}
    ]
    response_obj = client.chat.completions.create(
        model=deployment_name,
        messages=messages,
        max_tokens=400
    )
    # Try to parse JSON from response
    import re
    resp = response_obj.choices[0].message.content
    try:
        # Extract JSON from response
        match = re.search(r'\{.*\}', resp, re.DOTALL)
        if match:
            return json_mod.loads(match.group(0))
        return {}
    except Exception:
        return {}

# Get PYQ Recommended Question (now uses LLM extraction and filtering)
@app.post("/get-single-question/")
async def get_user_question_info(content):
    try:
        extracted = extract_subject_chapter_topics(content)
        filtered_df = data.copy()
        if extracted.get('subject'):
            filtered_df = filtered_df[filtered_df['subject'].str.lower() == extracted['subject'].lower()]
        if extracted.get('chapter'):
            filtered_df = filtered_df[filtered_df['chapter'].str.lower() == extracted['chapter'].lower()]
        if extracted.get('topics') and isinstance(extracted['topics'], list) and extracted['topics']:
            filtered_df = filtered_df[filtered_df['topic'].str.lower().isin([t.lower() for t in extracted['topics']])]
        if filtered_df.empty:
            filtered_df = data.copy()
        print("Extracted subject/chapter/topics:", extracted)
        texts = (
            filtered_df['question'].astype(str)
            + ' ' + filtered_df['options'].astype(str)
            + ' ' + filtered_df['explanation'].astype(str)
        ).tolist()
        meta = filtered_df.to_dict(orient='records')

        context_parts = []
        for item in content:
            if item["type"] == "text":
                context_parts.append(f"User Query: {item['text']}")
            elif item["type"] == "image_url":
                context_parts.append(f"Image Context: {item['image_url']['url']}")
        combined_context = "\n".join(context_parts)
        query_embedding = model.encode([combined_context])

        import numpy as np
        if texts:
            embeddings = model.encode(texts)
            temp_index = faiss.IndexFlatL2(embeddings.shape[1])
            temp_index.add(np.array(embeddings))
            distances, indices = temp_index.search(query_embedding, min(5, len(texts)))
            results = [meta[i] for i in indices[0]]
        else:
            results = []

        context = "\n".join([f"Q: {result['question']}" for result in results])
        SYSTEM_PROMPT = """
        You are a JEE/NEET exam question provider. Given similar questions from a database, pick the BEST matching one and reformat it.

        STRICT OUTPUT FORMAT (copy this exactly, fill every field):
        Examination and Year of Question: [exam name] [year]
        Topics: [comma-separated topics]
        Question: [full question text on one line]
        Options:
        a) [option text]
        b) [option text]
        c) [option text]
        d) [option text]

        RULES:
        1. The subject (Physics/Chemistry/Math) of your question MUST match the user's query subject.
        2. Every field MUST be filled - no empty or placeholder values.
        3. All 4 options (a, b, c, d) MUST be present with actual content.
        4. If the question has math, write it plainly: x^2, sqrt(), a/b.
        5. Output ONLY the formatted question. No explanations, no preamble, no extra text.
        6. If you cannot determine the exam/year, use "Sample Question" as default.
        7. Do NOT leave any field blank under any circumstances."""
        content_message = f"Here are some questions similar to the user's query and images:\n{context}\n\nPlease provide the best matching question in the strict format."
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content_message}
        ]
        response_obj = client.chat.completions.create(
            model=deployment_name,
            messages=messages,
            max_tokens=2000
        )
        return {"context": combined_context, "response": response_obj.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
     

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
        SYSTEM_PROMPT = """
        You are a JEE/NEET exam question provider. Given similar questions from a database, pick the BEST matching one and reformat it.

        STRICT OUTPUT FORMAT (copy this exactly, fill every field):
        Examination and Year of Question: [exam name] [year]
        Topics: [comma-separated topics]
        Question: [full question text on one line]
        Options:
        a) [option text]
        b) [option text]
        c) [option text]
        d) [option text]

        RULES:
        1. The subject (Physics/Chemistry/Math) of your question MUST match the user's query subject.
        2. Every field MUST be filled - no empty or placeholder values.
        3. All 4 options (a, b, c, d) MUST be present with actual content.
        4. If the question has math, write it plainly: x^2, sqrt(), a/b.
        5. Output ONLY the formatted question. No explanations, no preamble, no extra text.
        6. If you cannot determine the exam/year, use "Sample Question" as default.
        7. Do NOT leave any field blank under any circumstances."""
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

# Get Quiz Questions
@app.post("/get-quiz-questions/")
async def get_quiz_questions(num_ques: int, subjects: List[str] = Query(None), topics: List[str] = Query(None)):
    # Subjects: physics, chemistry, maths
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

# Generate Flashcards
@app.post('/get-flashcards-data')
async def get_flashcards_data():
    if ticked_files_store == []:
        return []

    # Read content from ticked files
    file_contents = []
    image_files = []
    for filename in ticked_files_store:
        file_path = os.path.join("uploads", filename)
        if not os.path.exists(file_path):
            continue
        if filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
            image_files.append(filename)
            continue
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                file_contents.append(f.read())
        except Exception:
            pass

    if not file_contents and not image_files:
        return []

    combined_text = "\n\n".join(file_contents)
    # Truncate to avoid token limits
    combined_text = combined_text[:8000]

    FLASHCARD_PROMPT = (
        "You are a flashcard generator for students preparing for JEE/NEET exams. "
        "Given the following study material, generate 10 flashcards as a JSON array. "
        "Each flashcard must have exactly these fields: \"question\", \"answer\", \"topic\". "
        "The topic should be the main chapter/concept the question belongs to. "
        "For any math expressions, use LaTeX wrapped in dollar signs: $...$ for inline math. "
        "Do NOT use parentheses like \\( \\) for math. Use ONLY dollar signs $...$ as math delimiters. "
        "CRITICAL: Every backslash in LaTeX must be doubled in the JSON string. "
        "Example: [{\"question\": \"What is $E = E^{\\\\circ} - \\\\frac{RT}{nF} \\\\ln Q$ called?\", "
        "\"answer\": \"The Nernst Equation: $E = E^{\\\\circ} - \\\\frac{RT}{nF} \\\\ln Q$\", "
        "\"topic\": \"Electrochemistry\"}] "
        "Return ONLY the JSON array, no markdown fences, no extra text."
    )

    # Build content with text and images
    content = []
    if combined_text.strip():
        content.append({"type": "text", "text": combined_text})
    for image in image_files:
        image_path = f"uploads/{image}"
        data_url = local_image_to_data_url(image_path)
        content.append({"type": "image_url", "image_url": {"url": data_url}})

    if not content:
        return []

    try:
        response_obj = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": FLASHCARD_PROMPT},
                {"role": "user", "content": content}
            ],
            max_tokens=4000
        )
        response_text = response_obj.choices[0].message.content
        print(f"Flashcards raw response: {response_text}")

        # Try to parse as JSON
        import json as json_mod
        import re as re_mod
        # Strip markdown code fences if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Fix backslash escaping for LaTeX in JSON:
        # Protect already-doubled backslashes, then double all remaining single ones
        cleaned = cleaned.replace('\\\\', '\x00DBL\x00')
        cleaned = cleaned.replace('\\"', '\x00QT\x00')
        cleaned = cleaned.replace('\\', '\\\\')
        cleaned = cleaned.replace('\x00DBL\x00', '\\\\')
        cleaned = cleaned.replace('\x00QT\x00', '\\"')

        flashcards = json_mod.loads(cleaned)
        return flashcards
    except Exception as e:
        print(f"Error in /get-flashcards-data: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")
    