import os
import base64
import fitz  # PyMuPDF
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
import asyncio
from openai import OpenAI
from sentence_transformers import SentenceTransformer

hf_model = SentenceTransformer("all-MiniLM-L6-v2")

def embedding_function(texts):
    return hf_model.encode(texts).tolist()

endpoint = "https://firsttimerschat1.openai.azure.com/openai/v1"
api_key = "BKODepscxWslIBsfK9Ty9sBR6Vvrhj4CziEHmeEG1OkzkUoaIZ41JQQJ99CCACqBBLyXJ3w3AAABACOG34DF"

client = OpenAI(
    base_url=endpoint,
    api_key=api_key
)

async def caption_image(image_bytes: bytes) -> str:
    """
    Generate a caption for an image using OpenAI's GPT-4o model.
    """
    img_b64 = base64.b64encode(image_bytes).decode("utf-8")
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Describe this image in one sentence."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{img_b64}"
                    }
                }
            ]
        }
    ]
    response = client.chat.completions.create(
        model = "gpt-4.1-nano",
        messages=messages
    )
    return response.choices[0].message.content

async def main():
    embedding_model = embedding_function
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pdf_directory = os.path.join(BASE_DIR, "papers")
    faiss_index_directory = os.path.join(BASE_DIR, "papers", "faiss_index")

    documents = []
    for filename in os.listdir(pdf_directory):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(pdf_directory, filename)
            # Extract text
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())

            # Extract and caption images
            doc = fitz.open(pdf_path)
            for page_num, page in enumerate(doc):
                images = page.get_images(full=True)
                for img_index, img in enumerate(images):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    caption = await caption_image(image_bytes)
                    documents.append(
                        Document(
                            page_content=f"[Image on page {page_num+1} of {filename}]: {caption}",
                            metadata={"source": filename, "page": page_num+1, "type": "image"}
                        )
                    )

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    split_docs = splitter.split_documents(documents)
    faiss_index = FAISS.from_documents(split_docs, embedding_model)
    os.makedirs(faiss_index_directory, exist_ok=True)
    faiss_index.save_local(faiss_index_directory)
    print("✅ FAISS index with image captions created and saved successfully!")

if __name__ == "__main__":
    asyncio.run(main())