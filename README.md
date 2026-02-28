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

7. **Run the FastAPI backend**  
   ```
   uvicorn backend.api_main:app --reload
   ```

The FastAPI backend will be available at http://localhost:8000

### FastAPI Endpoints

- `GET /health` — Health check
- `POST /analyze-document/` — Upload and analyze a PDF document
- `POST /chat/` — Query the AI model

## Frontend Setup (React)

1. **Navigate to the project root**
   ```
   cd .. # if you are in backend
   cd "C:\Users\Arnav Agarwal\Desktop\Microsoft Hack"
   ```

2. **Create React app**
   ```
   npx create-react-app frontend
   ```

3. **Start the React development server**
   ```
   cd frontend
   npm start
   ```

The React app will run at http://localhost:3000

## Notes

- Place your PDF files in the `Docs` folder.
- Make sure your `.env` file is in the same folder as `main_architecture.py`.
 - FastAPI backend endpoints are available at http://localhost:8000