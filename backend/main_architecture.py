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

def get_speech_input(speech_input_client=speech_input_client): # async ig
    pass 

llm = None
try:
    llm = ChatOpenAI(
        base_url="https://models.github.ai/inference",
        model="openai/gpt-4.1",
        api_key= os.getenv("CHAT_API") 
    )
    logging.info("Model Working")
except:
    logging.info("Model expired: Switch Model or Key")

llm.invoke("how r u?")