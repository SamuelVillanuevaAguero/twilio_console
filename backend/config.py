"""
Configuración centralizada de la aplicación
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Clase de configuración de la aplicación"""
    
    # Flask
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Cache
    CACHE_TTL_SECONDS = 300  # 5 minutos
    
    # API
    MAX_MESSAGES_PER_PAGE = 100
    DEFAULT_MESSAGES_PER_PAGE = 50
    TWILIO_PAGE_SIZE = 100
    
    # Timezone
    TIMEZONE_OFFSET_HOURS = 6  # UTC-6
    
    # Sesión
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hora
