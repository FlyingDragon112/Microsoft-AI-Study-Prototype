from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
import logging 
import os

logging.basicConfig(level=logging.INFO)
load_dotenv()

# https://learn.microsoft.com/en-us/python/api/overview/azure/ai-documentintelligence-readme?view=azure-python

endpoint = os.getenv("DOC_ENDPOINT")
key = os.getenv("DOC_KEY")

doc_client = DocumentIntelligenceClient(endpoint, AzureKeyCredential(key))
vid_client = None
speech_input_client = None
handwritten_doc_client = None

def get_document_text(filepath,doc_client=doc_client):
    text = ""
    with open(filepath, "rb") as f:
        poller = doc_client.begin_analyze_document(
            model_id="prebuilt-read",     
            body=f,
            content_type="application/pdf"
        )
        result = poller.result()

    for page in result.pages:
        for line in page.lines:
            text += line.content
    
    logging.info(f"Document {filepath} Registered")
    return text 

def get_handwritten_text(filepath_handwritten_doc_client=handwritten_doc_client):
    pass 

def get_video_context(filepath,vid_client = vid_client):
    pass

def get_speech_input(speech_input_client=speech_input_client):
    pass 

SYSTEM_PROMPT = (
    "You are a helpful math tutor. When explaining solutions, "
    "format your response in plain text. Do NOT use LaTeX, dollar signs ($), "
    "\\boxed{}, or any math markup. Use simple notation like: "
    "x^2 for exponents, sqrt() for square roots, and write fractions as a/b. "
    "Use clear step-by-step formatting with numbered steps."
    "Clearly mark end of lines with '\n'"   
)

llm = None
try:
    llm = ChatOpenAI(
        base_url="https://models.github.ai/inference",
        model="openai/gpt-4.1",
        api_key=os.getenv("CHAT_API"),
    )
    logging.info("Model Working")
except Exception as e:
    logging.info(f"Model expired: Switch Model or Key. Error: {e}")
