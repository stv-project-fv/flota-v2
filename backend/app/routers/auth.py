from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.supabase_url}/auth/v1/token?grant_type=password",
            json={"email": req.email, "password": req.password},
            headers={"apikey": settings.supabase_anon_key},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return resp.json()
