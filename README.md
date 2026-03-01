# CrackIT — AI-Powered Study Assistant

CrackIT is an AI-powered study assistant that helps students understand textbook content through an interactive chat interface. Upload PDF documents, ask questions, and get detailed explanations with full LaTeX math rendering.

## Tech Stack

- **Frontend:** React 19, React Markdown, KaTeX (math rendering)
- **Backend:** FastAPI, LangChain, OpenAI, Azure Document Intelligence
- **Languages:** JavaScript, Python

## Project Structure

```
Microsoft Hack/
├── backend/
│   ├── api_main.py            # FastAPI server
│   ├── main_architecture.py   # Document processing & LLM setup
│   ├── create_book_db.py      # Book database creation
│   ├── books/                 # Book data
│   └── .env                   # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main React app with chat UI
│   │   └── App.css            # Styling
│   └── public/
├── Docs/                      # PDF documents for analysis
├── requirements.txt           # Python dependencies
└── README.md
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/FlyingDragon112/microsoft-ai-study.git
cd "Microsoft Hack"
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r ../requirements.txt
```

Create a `.env` file in the `backend/` folder:

```
DOC_ENDPOINT=your-doc-endpoint-url
DOC_KEY=your-doc-key
CHAT_API=your-chat-api-key
```

Start the backend:

```bash
uvicorn api_main:app --reload
```

The API will be available at http://localhost:8000

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

The app will be available at http://localhost:3000

## API Endpoints

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/health`             | Health check                       |
| POST   | `/analyze-document/`  | Upload and analyze a PDF document  |
| POST   | `/chat/`              | Send a query to the AI model       |

## Features

- Interactive chat interface with message history
- PDF document upload and analysis via Azure Document Intelligence
- AI-powered responses using LangChain + OpenAI
- LaTeX math rendering with KaTeX (supports `$...$`, `$$...$$`, `\[...\]`, `\(...\)`)
- Markdown formatting in responses (code blocks, lists, tables, etc.)
- Auto-scrolling chat with internal scroll (no page scroll)
- Source Library sidebar for managing study materials

## Notes

- Place PDF files in the `Docs/` folder for analysis.
- Ensure `.env` is configured before starting the backend.
- Both frontend and backend must be running simultaneously.