from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    nickname: str
    password: str


class UserResponse(BaseModel):
    id: int
    nickname: str

    model_config = ConfigDict(from_attributes=True)
