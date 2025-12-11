"""
Punto de entrada de la aplicación Flask
"""
from flask import Flask, jsonify, send_from_directory, Response
import logging
import os
from pathlib import Path

from .config import Config
from .services.twilio_service import TwilioService
from .services.cache_service import CacheService
from .routes.message_routes import MessageRoutes


def create_app() -> Flask:
    """
    Factory function para crear la aplicación Flask
    
    Returns:
        Instancia configurada de Flask
    """
    # Validar configuración
    Config.validate()
    
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Obtener directorio base del proyecto (más robusto)
    current_file = Path(__file__).resolve()
    backend_dir = current_file.parent
    base_dir = backend_dir.parent
    frontend_dir = base_dir / 'frontend'
    static_dir = frontend_dir / 'static'
    
    # Log de rutas para debug
    logger = logging.getLogger(__name__)
    logger.info(f"Base directory: {base_dir}")
    logger.info(f"Frontend directory: {frontend_dir}")
    logger.info(f"Static directory: {static_dir}")
    logger.info(f"Static directory exists: {static_dir.exists()}")
    
    # Crear aplicación
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Inicializar servicios
    twilio_service = TwilioService(
        account_sid=Config.TWILIO_ACCOUNT_SID,
        auth_token=Config.TWILIO_AUTH_TOKEN,
        timezone_offset_hours=Config.TIMEZONE_OFFSET_HOURS,
        page_size=Config.TWILIO_PAGE_SIZE
    )
    
    cache_service = CacheService(
        ttl_seconds=Config.CACHE_TTL_SECONDS
    )
    
    # Registrar rutas
    message_routes = MessageRoutes(twilio_service, cache_service)
    app.register_blueprint(message_routes.blueprint)
    
    # Ruta principal
    @app.route("/")
    def index():
        """Sirve el HTML principal"""
        html_path = frontend_dir / 'index.html'
        logger.info(f"Loading HTML from: {html_path}")
        
        if not html_path.exists():
            return f"Error: HTML file not found at {html_path}", 404
        
        with open(html_path, 'r', encoding='utf-8') as file:
            html = file.read()
        
        html = html.replace('{{NUMERO_TWILIO}}', Config.TWILIO_PHONE_NUMBER)
        return html
    
    # Rutas para archivos estáticos
    @app.route("/static/<path:filename>")
    def static_files(filename):
        """Sirve archivos estáticos"""
        file_path = static_dir / filename
        logger.info(f"Serving static file: {file_path}")
        logger.info(f"File exists: {file_path.exists()}")
        
        if not file_path.exists():
            return f"File not found: {filename}", 404
        
        return send_from_directory(str(static_dir), filename)
    
    # Endpoint de salud
    @app.route("/health")
    def health():
        """Endpoint para verificar salud del servidor"""
        return jsonify({
            "status": "ok",
            "cache_size": cache_service.size(),
            "paths": {
                "base_dir": str(base_dir),
                "frontend_dir": str(frontend_dir),
                "static_dir": str(static_dir),
                "static_exists": static_dir.exists()
            }
        })
    
    return app


def main():
    """Función principal para ejecutar el servidor"""
    app = create_app()
    app.run(
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )


if __name__ == "__main__":
    main()
