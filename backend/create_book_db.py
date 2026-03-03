import os
import re
import logging
from pypdf import PdfReader

from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI


# -----------------------------
# STEP 1: Extract PDF Text
# -----------------------------

def scrape_pdf_and_save_text():
    pdf_path = os.path.join("Docs", "paper 1.pdf")
    reader = PdfReader(pdf_path)

    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    save_path = os.path.join("Docs", "paper_1_text.txt")
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(text)

    logging.info("PDF text extracted successfully.")


# -----------------------------
# STEP 2: Smart Question Split
# -----------------------------

def split_by_question(text):
    """
    Splits the document by question numbers like:
    1. ...
    2. ...
    """

    pattern = r"\n\s*(\d+)\.\s"
    splits = re.split(pattern, text)

    docs = []

    # splits structure:
    # [text_before, q_no, content, q_no, content, ...]

    for i in range(1, len(splits), 2):
        question_number = splits[i]
        content = splits[i + 1]

        doc = Document(
            page_content=content.strip(),
            metadata={"question_number": question_number}
        )

        docs.append(doc)

    return docs


# -----------------------------
# STEP 3: Build Vector Store
# -----------------------------

def build_vector_store(docs):
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-large-en-v1.5",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )

    db = FAISS.from_documents(docs, embeddings)

    logging.info("Vector store created successfully.")

    return db


# -----------------------------
# STEP 4: RAG Query Function
# -----------------------------

def run_rag_query(db, query):

    retriever = db.as_retriever(search_kwargs={"k": 3})
    relevant_docs = retriever.invoke(query)

    context = "\n\n".join(
        [f"Question {doc.metadata['question_number']}:\n{doc.page_content}"
         for doc in relevant_docs]
    )

    llm = ChatOpenAI(
        base_url="https://models.github.ai/inference",
        model="openai/gpt-4.1",
        api_key= "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"
    )

    prompt = f"""
You are a JEE exam expert.

Use ONLY the context provided below to answer the question.
If the answer is not found in the context, say:
"Answer not found in provided document."

Context:
{context}

Question:
{query}

Give a clear structured answer.
"""

    response = llm.invoke(prompt)

    return response.content


# -----------------------------
# MAIN PIPELINE
# -----------------------------

def main():

    logging.basicConfig(level=logging.INFO)

    # Step 1: Extract text (run once)
    scrape_pdf_and_save_text()

    # Step 2: Load text
    text_path = os.path.join("Docs", "paper_1_text.txt")
    with open(text_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Step 3: Smart split
    docs = split_by_question(text)

    # Step 4: Build vector DB
    db = build_vector_store(docs)

    # Step 5: Ask query
    query = "Summarize the probability questions in this paper."

    answer = run_rag_query(db, query)

    print("\n===== RAG ANSWER =====\n")
    print(answer)


if __name__ == "__main__":
    main()