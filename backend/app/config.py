from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    jwt_secret: str = ""
    secret_key: str = ""
    environment: str = "development"
    database_url: str = ""

    logo_url: str = "https://i.ibb.co/chpfBP5X/Logo1.png"
    qr_logo_url: str = "https://i.ibb.co/bhRNpsL/Logo-QR.png"
    banner_url: str = "https://i.ibb.co/Fq6mSJgm/Secretar-a-de-Obras-Servicios-P-blicos-Ambiente-y-Planificaci-n-Urbana.png"

    color_principal: str = "#009B77"
    color_secundario: str = "#DAA520"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
