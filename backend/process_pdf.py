import fitz  # PyMuPDF
import os
from pix2text import Pix2Text

# Paths
pdf_folder = r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\papers\pdfs"
output_base_folder = r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\papers\images"
text_output_folder = r"C:\Users\Arnav Agarwal\Desktop\Microsoft Hack\papers\text"

# Ensure output folders exist
os.makedirs(output_base_folder, exist_ok=True)
os.makedirs(text_output_folder, exist_ok=True)

# Initialize Pix2Text
p2t = Pix2Text()

# Function to process a single PDF
def process_pdf(pdf_path, output_folder, text_folder):
    # Open the PDF
    pdf_document = fitz.open(pdf_path)
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]

    # Create a folder for the images
    image_folder = os.path.join(output_folder, pdf_name)
    os.makedirs(image_folder, exist_ok=True)

    # Markdown file to save extracted text
    text_file_path = os.path.join(text_folder, f"{pdf_name}.md")
    with open(text_file_path, "w", encoding="utf-8") as text_file:
        text_file.write(f"# Extracted Text for {pdf_name}\n\n")

        # Convert each page to an image and extract text
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            pix = page.get_pixmap(dpi=300)  # Adjust dpi for quality
            image_path = os.path.join(image_folder, f"page_{page_num + 1}.png")
            pix.save(image_path)
            print(f"Saved: {image_path}")

            # Extract text using Pix2Text
            result = p2t.recognize(image_path)
            print(f"Extracted text from page {page_num + 1}: {result}")

            # Write the extracted text to the Markdown file
            text_file.write(f"## Page {page_num + 1}\n\n")
            text_file.write(result + "\n\n")

    print(f"Text extraction completed for {pdf_name}. Markdown saved at: {text_file_path}")

# Process all PDFs in the folder
for pdf_file in os.listdir(pdf_folder):
    if pdf_file.endswith(".pdf"):
        pdf_path = os.path.join(pdf_folder, pdf_file)
        process_pdf(pdf_path, output_base_folder, text_output_folder)

print("Processing completed for all PDFs.")