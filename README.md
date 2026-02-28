# Microsoft Hack Backend Setup

## Prerequisites

- Python 3.8+
- pip

## Setup Instructions

1. **Clone the repository**  
   ```
   git clone https://github.com/FlyingDragon112/microsoft-ai-study.git
   cd Microsoft Hack/backend
   ```

2. **Update your local repository**  
    ```
    git pull origin main
    ```

3. **Create and activate a virtual environment**  
   ```
   python -m venv venv
   venv\Scripts\activate   # On Windows
   ```

4. **Install dependencies**  
   ```
   pip install -r requirements.txt
   ```

5. **Add environment variables**  
   - Create a `.env` file in the `backend` folder.
   - Add your keys and endpoints:
     ```
     DOC_ENDPOINT=your-doc-endpoint-url
     DOC_KEY=your-doc-key
     CHAT_API=your-chat-api-key
     ```

6. **Run the main script**  
   ```
   python main_architecture.py
   ```

## Notes

- Place your PDF files in the `Docs` folder.
- Make sure your `.env` file is in the same folder as `main_architecture.py`.