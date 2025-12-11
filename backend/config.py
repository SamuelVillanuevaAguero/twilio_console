"""
Configuración centralizada de la aplicación
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Clase de configuración de la aplicación"""
    
    # Twilio
    TWILIO_ACCOUNT_SID = os.getenv("ACCOUNT_SID_TWILIO")
    TWILIO_AUTH_TOKEN = os.getenv("AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.getenv("NUMERO_TWILIO")
    
    # Flask
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Cache
    CACHE_TTL_SECONDS = 300  # 5 minutos
    
    # API
    MAX_MESSAGES_PER_PAGE = 100
    DEFAULT_MESSAGES_PER_PAGE = 50
    TWILIO_PAGE_SIZE = 100
    
    # Timezone
    TIMEZONE_OFFSET_HOURS = 6  # UTC-6
    
    @classmethod
    def validate(cls):
        """Valida que las variables de entorno requeridas estén presentes"""
        required = [
            ('TWILIO_ACCOUNT_SID', cls.TWILIO_ACCOUNT_SID),
            ('TWILIO_AUTH_TOKEN', cls.TWILIO_AUTH_TOKEN),
            ('TWILIO_PHONE_NUMBER', cls.TWILIO_PHONE_NUMBER)
        ]
        
        missing = [name for name, value in required if not value]
        
        if missing:
            raise ValueError(
                f"Faltan variables de entorno requeridas: {', '.join(missing)}"
            )
