"""
Vercel Serverless Function Entry Point for FastAPI Backend
This allows deploying the FastAPI backend as Vercel serverless functions
"""
import sys
import os

# Add backend directory to path so we can import backend modules
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, backend_path)

from mangum import Mangum

# Import FastAPI app from backend
try:
    from main import app
except ImportError:
    # Fallback if import fails
    import importlib.util
    spec = importlib.util.spec_from_file_location("main", os.path.join(backend_path, "main.py"))
    main_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(main_module)
    app = main_module.app

# Wrap FastAPI app with Mangum for Vercel serverless compatibility
handler = Mangum(app, lifespan="off")

