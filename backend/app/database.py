from urllib.parse import quote_plus
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

if settings.database_url:
    DATABASE_URL = settings.database_url
elif settings.supabase_url:
    parts = settings.supabase_url.replace("https://", "").split(".")
    ref = parts[0].split("-")[-1] if "-" in parts[0] else parts[0]
    safe_password = quote_plus(settings.supabase_service_key)
    DATABASE_URL = f"postgresql+asyncpg://postgres:{safe_password}@db.{ref}.supabase.co:5432/postgres"
else:
    DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=5, max_overflow=10)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
