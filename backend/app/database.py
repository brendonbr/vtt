from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Get the absolute path to the backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_file = os.path.join(backend_dir, "vtt.db")
DATABASE_URL = f"sqlite:///{db_file}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()