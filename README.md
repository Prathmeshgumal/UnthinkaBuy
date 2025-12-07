# UnthinkaBuy - E-commerce Application

A modern e-commerce application built with Next.js frontend and FastAPI backend, powered by Supabase.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: pnpm

## Database Schema

The application uses the following tables in Supabase:

- **users**: Custom user management (stores name, email, password hash).
- **products**: Product catalog with details like price, ratings, categories, and images.
- **cart_items**: Tracks items in user carts. Linked to `users` and `products` via Foreign Keys.
- **favorites**: User wishlists/saved items. Linked to `users` and `products`.
- **cart_activity_log**: Audit trail for all cart actions (add/remove/update).
- **favorites_activity_log**: Audit trail for all wishlist actions.
- **sessions**: Manages user session tokens for authentication.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** - Install via `npm install -g pnpm`
- **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
- **Supabase Account** - [Sign up](https://supabase.com/) (free tier available)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd UnthinkaBuy
```

### 2. Supabase Setup

1. Create a new project at [Supabase Dashboard](https://app.supabase.com/)
2. Go to **SQL Editor** in your Supabase project
3. Run the SQL scripts in order:
   - First, run `scripts/001-create-tables.sql` to create the database tables
   - Then, run `scripts/002-seed-products.sql` to seed initial product data (if available)
4. Go to **Settings** → **API** and copy:
   - Project URL (SUPABASE_URL)
   - Anon/Public Key (SUPABASE_ANON_KEY)
   - Database connection string (POSTGRES_URL) from **Settings** → **Database**

### 3. Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `backend` directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SECRET_KEY=your_jwt_secret_key_here_change_this_in_production
POSTGRES_URL=your_postgres_connection_string
```

**Note**: Generate a secure `SECRET_KEY` for production. You can use:

```python
import secrets
print(secrets.token_urlsafe(32))
```

5. Start the backend server:

```bash
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

### 4. Frontend Setup

1. Navigate back to the root directory:

```bash
cd ..
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:

```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## Running the Application

### Development Mode

You need to run both the backend and frontend servers:

**Terminal 1 - Backend:**

```bash
cd backend
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**

```bash
pnpm dev
```

### Production Build

**Frontend:**

```bash
pnpm build
pnpm start
```

**Backend:**

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Project Structure

```
UnthinkaBuy/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── backend/               # FastAPI backend
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration settings
│   ├── database.py       # Database connection
│   ├── models.py         # Data models
│   ├── routes/           # API route handlers
│   └── utils/            # Utility functions
├── components/            # React components
├── lib/                  # Utility libraries
├── scripts/              # SQL scripts for database setup
└── public/               # Static assets
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Products

- `GET /api/products` - Get all products (with filters)
- `GET /api/products/{id}` - Get single product
- `GET /api/products/categories` - Get all categories

### Query Parameters for Products

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `category` - Filter by main category
- `sub_category` - Filter by subcategory
- `min_rating` - Minimum rating filter
- `search` - Search in product name
- `sort_by` - Sort field (default: created_at)
- `sort_by` - Sort field (default: created_at)
- `sort_order` - asc or desc (default: desc)

### Cart & Favorites

- `GET /api/cart` - Get user's cart with product details
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/{product_id}` - Update item quantity
- `DELETE /api/cart/{product_id}` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites/{product_id}` - Add item to favorites
- `DELETE /api/favorites/{product_id}` - Remove item from favorites
- `GET /api/favorites/check/{product_id}` - Check if product is favorited

## Environment Variables

### Backend (.env in backend/)

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SECRET_KEY` - JWT secret key for token generation
- `POSTGRES_URL` - PostgreSQL connection string

### Frontend (.env.local in root/)

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Troubleshooting

### Backend Issues

1. **Module not found errors**: Ensure virtual environment is activated and dependencies are installed
2. **Database connection errors**: Verify Supabase credentials in `.env` file
3. **Port already in use**: Change the port in the uvicorn command: `--port 8001`
4. **pydantic-core installation error (Rust/Cargo required)**:
   - **Solution 1 (Recommended)**: The requirements.txt has been updated with newer versions that have pre-built wheels. Try installing again:

     ```bash
     pip install -r requirements.txt
     ```

   - **Solution 2**: If you still encounter issues, install Rust from [rustup.rs](https://rustup.rs/) and ensure it's on your PATH
   - **Solution 3**: Use Python 3.11 or 3.12 instead of 3.14, as they have better pre-built wheel support

### Frontend Issues

1. **Dependencies not installing**: Try deleting `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again
2. **Environment variables not working**: Ensure `.env.local` is in the root directory and restart the dev server
3. **Supabase connection errors**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

### Database Issues

1. **Tables not found**: Run the SQL scripts in Supabase SQL Editor
2. **Connection timeout**: Check your Supabase project status and network connection

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [pnpm Documentation](https://pnpm.io/)

## Deployment

### Backend (Vercel)

The backend is configured for Vercel Serverless deployment.

1. **Import** the repository to Vercel.
2. Set **Root Directory** to `backend`.
3. Set **Framework Preset** to `Other`.
4. Add Environment Variables:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `SECRET_KEY`

### Frontend (Netlify)

1. **Import** the repository to Netlify.
2. Set **Build command** to `npm run build` (or `pnpm build`).
3. Set **Publish directory** to `.next`.
4. Add Environment Variables:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_FASTAPI_URL` (The URL of your deployed Vercel backend, e.g., `https://your-app.vercel.app`)

## Local Machine Learning (Optional)

If you need to run the `embedding.py` script locally to generate vector embeddings:

1. Install the ML dependencies (these are excluded from production to save space):

```bash
pip install -r requirements-ml.txt
```

2. Run the script:

```bash
python embedding.py
```

## License

This project is private and proprietary.
