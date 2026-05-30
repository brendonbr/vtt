from sqlalchemy import Column, Integer, String
from pydantic import BaseModel, ConfigDict
from app.database import Base
import bcrypt

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, unique=True, index=True)
    password_hash = Column(String)

    def set_password(self, password: str):
        self.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def verify_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode(), self.password_hash.encode())

class UserCreate(BaseModel):
    nickname: str
    password: str

class UserResponse(BaseModel):
    id: int
    nickname: str

    model_config = ConfigDict(from_attributes=True)