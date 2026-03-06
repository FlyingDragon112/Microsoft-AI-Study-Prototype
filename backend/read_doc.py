from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
import os
from dotenv import load_dotenv
load_dotenv()
# Azure Form Recognizer credentials
endpoint = os.getenv("DOC_ENDPOINT") # Replace with your Azure endpoint
key = os.getenv("DOC_KEY")  # Replace with your Azure key

def analyze_document(file_path):
    # Initialize the client
    document_analysis_client = DocumentAnalysisClient(endpoint=endpoint, credential=AzureKeyCredential(key))

    # Read the document
    with open(file_path, "rb") as document:
        poller = document_analysis_client.begin_analyze_document("prebuilt-document", document)
        result = poller.result()

    # Extract and return the content
    extracted_content = []
    for page in result.pages:
        for line in page.lines:
            extracted_content.append(line.content)

    return "\n".join(extracted_content)

# Example usage
if __name__ == "__main__":
    file_path = r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\papers\pdfs\que_1733315917.pdf" # Replace with the path to your document
    content = analyze_document(file_path)
    print("Extracted Content:", content)