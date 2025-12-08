# UnthinkaBuy

An AI-powered e-commerce platform built with Next.js and FastAPI.

## Features

- **AI Recommendations:** Personalized product suggestions using Mistral AI.
- **Hybrid Search:** Semantic search combining keywords and vector embeddings.
- **Real-time Cart & Favorites:** Instant updates with optimistic UI.
- **Responsive Design:** Modern UI with Shadcn/UI components.

## Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **Supabase Account** (for Database & Auth)
- **Mistral AI API Key** (Optional, for "Why" explanations)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/UnthinkaBuy.git
cd UnthinkaBuy
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Setup Environment Variables
cp .env.example .env.local
# Edit .env.local with your Supabase keys
```

### 3. Backend Setup

```bash
cd backend

# Create Virtual Environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Setup Environment Variables
cp .env.example .env
# Edit .env with your Database & API keys
```

## Running the Project

### Start Backend (Terminal 1)

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

*Backend runs on <http://localhost:8000>*

### Start Frontend (Terminal 2)

```bash
# In the root directory
npm run dev
```

*Frontend runs on <http://localhost:3000>*

## Deployment

See `deployment_plan.md` for detailed instructions on deploying to Vercel.
