from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from langchain_openai import ChatOpenAI
import logging 
from dotenv import load_dotenv
import os

logging.basicConfig(level=logging.INFO)
load_dotenv()

# https://learn.microsoft.com/en-us/python/api/overview/azure/ai-documentintelligence-readme?view=azure-python

endpoint = os.getenv("DOC_ENDPOINT")
key = os.getenv("DOC_KEY")

doc_client = DocumentIntelligenceClient(endpoint, AzureKeyCredential(key))

def get_document_text(filepath,doc_client):
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

llm = ChatOpenAI(
    base_url="https://models.github.ai/inference",
    model="openai/gpt-4.1",
    api_key= os.getenv("CHAT_API") 
)

llm.invoke("how r u?")