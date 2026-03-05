from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from openai import OpenAI
import logging 
import os
import requests

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

endpoint = "https://firsttimerschat1.openai.azure.com/openai/v1"
deployment_name = "gpt-4.1-nano"
api_key = "BKODepscxWslIBsfK9Ty9sBR6Vvrhj4CziEHmeEG1OkzkUoaIZ41JQQJ99CCACqBBLyXJ3w3AAABACOG34DF"

client = OpenAI(
    base_url=endpoint,
    api_key=api_key
)

completion = client.chat.completions.create(
    model="gpt-4.1-nano",
    messages=[
        {
        "role": "user",
        "content": "Hi",
        }
    ],
)

print(completion.choices[0].message)