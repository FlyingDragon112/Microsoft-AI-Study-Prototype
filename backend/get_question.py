import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json

# Step 1: Load the dataset
dataset_path = r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\backend\data\data_jee.csv"  # Replace with your dataset path
data = pd.read_csv(dataset_path)

# Step 2: Initialize the SentenceTransformer model
model = SentenceTransformer('multi-qa-mpnet-base-dot-v1')  # Advanced model for semantic search
# Convert the 'options' column to the desired string format
data['options'] = data['options'].apply(
    lambda x: "\n".join([f"{opt['identifier']}) {opt['content']}" for opt in eval(x)])
)
# Step 3: Preprocess and create embeddings
# Combine relevant fields into a single text for embedding
data['combined_text'] = (
    f"Subject: {data['subject']} , "
    f"Chapter: {data['chapter']} , "
    f"Topic: {data['topic']} , "
    f"Question: {data['question']} , "
    f"Options:\n{data['options']} , "  # Options are now on separate lines
    f"Correct Option: {data['correct_option']} , "
    f"Explanation: {data['explanation']} , "
    f"Examination and Year: {data['paper_id']},"
)
texts = data['combined_text'].tolist()

# Generate embeddings
embeddings = model.encode(texts, show_progress_bar=True)

# Step 4: Create a FAISS index
dimension = embeddings.shape[1]  # Dimension of the embeddings
index = faiss.IndexFlatL2(dimension)  # L2 distance metric
index.add(np.array(embeddings))  # Add embeddings to the index

# Save the index for later use
faiss.write_index(index, "faiss_index.bin")

# Save metadata for retrieval
metadata = data.to_dict(orient='records')
with open("metadata.json", "w") as f:
    json.dump(metadata, f)

print("FAISS index and metadata saved successfully!")


# import pandas as pd
# from sentence_transformers import SentenceTransformer
# import faiss
# import numpy as np
# import json
# from openai import OpenAI

# # Load the FAISS index and metadata
# index = faiss.read_index("faiss_index.bin")
# with open("metadata.json", "r") as f:
#     metadata = json.load(f)

# # Initialize the SentenceTransformer model
# model = SentenceTransformer('multi-qa-mpnet-base-dot-v1')  # Same model used for embeddings

# # Initialize OpenAI client
# endpoint = "https://firsttimerschat1.openai.azure.com/openai/v1"
# deployment_name = "gpt-4.1-nano"
# api_key = "BKODepscxWslIBsfK9Ty9sBR6Vvrhj4CziEHmeEG1OkzkUoaIZ41JQQJ99CCACqBBLyXJ3w3AAABACOG34DF"

# client = OpenAI(
#     base_url=endpoint,
#     api_key=api_key
# )

# def query_with_llm(content, top_k=5):
#     # Construct the context from content (text and images)
#     context_parts = []
#     for item in content:
#         if item["type"] == "text":
#             context_parts.append(f"User Query: {item['text']}")
#         elif item["type"] == "image_url":
#             context_parts.append(f"Image Context: {item['image_url']['url']}")

#     # Combine all parts into a single context string
#     combined_context = "\n".join(context_parts)

#     # Generate embeddings for the combined context
#     query_embedding = model.encode([combined_context])

#     # Search the FAISS index
#     distances, indices = index.search(query_embedding, top_k)

#     # Retrieve metadata for the top results
#     results = [metadata[i] for i in indices[0]]

#     # Format the retrieved questions
#     context = "\n".join([f"Q: {result['question']}" for result in results])
#     SYSTEM_PROMPT = """You are a helpful assistant that provides similar questions based on the user's query and images.
#     Give ONLY ONE Question in the following format:
#     Examination and Year of Question - 
#     Topics - 
#     Question - 
#     Options - 
#     a)
#     b)
#     c)
#     d)
#     Ensure no field is left empty.
#     """
#     content_message = f"Here are some questions similar to the user's query and images:\n{context}\n\nPlease provide a list of these questions in a user-friendly format."
#     messages = [
#         {"role": "system", "content": SYSTEM_PROMPT},
#         {"role": "user", "content": content_message}
#     ]

#     # Call the OpenAI API
#     response_obj = client.chat.completions.create(
#         model=deployment_name,
#         messages=messages,
#         max_tokens=2000
#     )

#     return response_obj.choices[0].message.content

# import base64
# def local_image_to_data_url(image_path):

#     with open(image_path, "rb") as image_file:
#         base64_encoded_data = base64.b64encode(image_file.read()).decode('utf-8')

#     return f"data:image/png;base64,{base64_encoded_data}"

# content = [
#     {"type": "text", "text": "solve pls"},
#     {"type": "image_url", "image_url": {"url": local_image_to_data_url(r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\backend\uploads\Question.png")}}
# ]

# response = query_with_llm(content, top_k=3)
# print("LLM Response:", response)