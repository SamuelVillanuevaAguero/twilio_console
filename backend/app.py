"""
Punto de entrada de la aplicación Flask
"""
from flask import Flask, jsonify, send_from_directory, Response, session, redirect, url_for
import logging
import os
from pathlib import Path

from .config import Config
from .services.cache_service import CacheService
from .routes.message_routes import MessageRoutes
from .routes.auth_routes import AuthRoutes


def create_app() -> Flask:
    """
    Factory function para crear la aplicación Flask
    
    Returns:
        Instancia configurada de Flask
    """
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Obtener directorio base del proyecto
    current_file = Path(__file__).resolve()
    backend_dir = current_file.parent
    base_dir = backend_dir.parent
    frontend_dir = base_dir / 'frontend'
    static_dir = frontend_dir / 'static'
    
    logger = logging.getLogger(__name__)
    logger.info(f"Base directory: {base_dir}")
    logger.info(f"Frontend directory: {frontend_dir}")
    logger.info(f"Static directory: {static_dir}")
    
    # Crear aplicación
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configurar sesiones
    app.secret_key = Config.SECRET_KEY
    
    # Inicializar servicios
    cache_service = CacheService(
        ttl_seconds=Config.CACHE_TTL_SECONDS
    )
    
    # Registrar rutas
    auth_routes = AuthRoutes()
    app.register_blueprint(auth_routes.blueprint)
    
    message_routes = MessageRoutes(cache_service)
    app.register_blueprint(message_routes.blueprint)
    
    # Ruta principal - redirige a login si no está autenticado
    @app.route("/")
    def index():
        """Sirve el HTML principal o redirige a login"""
        if 'account_sid' not in session:
            return redirect('/login')
        
        html_path = frontend_dir / 'index.html'
        logger.info(f"Loading HTML from: {html_path}")
        
        if not html_path.exists():
            return f"Error: HTML file not found at {html_path}", 404
        
        with open(html_path, 'r', encoding='utf-8') as file:
            html = file.read()
        
        return html
    
    # Ruta de login
    @app.route("/login")
    def login_page():
        """Sirve la página de login"""
        # Si ya está autenticado, redirigir al index
        if 'account_sid' in session:
            return redirect('/')
        
        html_path = frontend_dir / 'login.html'
        logger.info(f"Loading login HTML from: {html_path}")
        
        if not html_path.exists():
            return f"Error: Login HTML file not found at {html_path}", 404
        
        with open(html_path, 'r', encoding='utf-8') as file:
            html = file.read()
        
        return html
    
    # Rutas para archivos estáticos
    @app.route("/static/<path:filename>")
    def static_files(filename):
        """Sirve archivos estáticos"""
        file_path = static_dir / filename
        logger.info(f"Serving static file: {file_path}")
        
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
            "authenticated": 'account_sid' in session,
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
