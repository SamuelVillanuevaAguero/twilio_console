"""
Script de inicio con diagnóstico detallado
Funciona tanto en desarrollo local como en producción (Render)
"""
from flask import Flask, jsonify, send_from_directory, Response
from pathlib import Path
import os
import sys

# Agregar directorio actual al path
sys.path.insert(0, str(Path(__file__).parent))

from backend.config import Config
from backend.services.twilio_service import TwilioService
from backend.services.cache_service import CacheService
from backend.routes.message_routes import MessageRoutes
from backend.routes.auth_routes import AuthRoutes

# Crear aplicación
app = Flask(__name__, static_folder=None)  # Deshabilitamos la carpeta static por defecto
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY

# Directorios - Rutas absolutas
BASE_DIR = Path(__file__).parent.absolute()
FRONTEND_DIR = BASE_DIR / 'frontend'
STATIC_DIR = FRONTEND_DIR / 'static'

# Determinar si estamos en producción o desarrollo
IS_PRODUCTION = os.getenv('RENDER', False) or os.getenv('PORT', False)

if IS_PRODUCTION:
    print("\n" + "="*60)
    print("🚀 MODO PRODUCCIÓN - RENDER")
    print("="*60)
else:
    print("\n" + "="*60)
    print("🔍 DIAGNÓSTICO DE RUTAS - MODO DESARROLLO")
    print("="*60)

print(f"📂 BASE_DIR: {BASE_DIR}")
print(f"   Existe: {BASE_DIR.exists()}")
print(f"\n📂 FRONTEND_DIR: {FRONTEND_DIR}")
print(f"   Existe: {FRONTEND_DIR.exists()}")
print(f"\n📂 STATIC_DIR: {STATIC_DIR}")
print(f"   Existe: {STATIC_DIR.exists()}")

if STATIC_DIR.exists() and not IS_PRODUCTION:
    print(f"\n📁 Contenido de STATIC_DIR:")
    for item in STATIC_DIR.rglob('*'):
        if item.is_file():
            rel_path = item.relative_to(STATIC_DIR)
            print(f"   ✓ {rel_path}")
print("="*60 + "\n")

# Inicializar servicios
cache_service = CacheService(ttl_seconds=Config.CACHE_TTL_SECONDS)

# Registrar rutas
auth_routes = AuthRoutes()
app.register_blueprint(auth_routes.blueprint)

message_routes = MessageRoutes(cache_service)
app.register_blueprint(message_routes.blueprint)


@app.route("/")
def index():
    """Sirve el HTML principal"""
    from flask import session, redirect
    
    if 'account_sid' not in session:
        return redirect('/login')
    
    html_path = FRONTEND_DIR / 'index.html'
    
    if not IS_PRODUCTION:
        print(f"📄 Sirviendo index.html desde: {html_path}")
    
    if not html_path.exists():
        return f"❌ Error: HTML no encontrado en {html_path}", 404
    
    with open(html_path, 'r', encoding='utf-8') as file:
        html = file.read()
    
    return Response(html, mimetype='text/html')


@app.route("/login")
def login():
    """Sirve el HTML de login"""
    from flask import session, redirect
    
    if 'account_sid' in session:
        return redirect('/')
    
    html_path = FRONTEND_DIR / 'login.html'
    
    if not IS_PRODUCTION:
        print(f"📄 Sirviendo login.html desde: {html_path}")
    
    if not html_path.exists():
        return f"❌ Error: Login HTML no encontrado en {html_path}", 404
    
    with open(html_path, 'r', encoding='utf-8') as file:
        html = file.read()
    
    return Response(html, mimetype='text/html')


@app.route("/static/<path:filename>")
def static_files(filename):
    """Sirve archivos estáticos con logging detallado"""
    file_path = STATIC_DIR / filename
    
    if not IS_PRODUCTION:
        print(f"\n🔍 Solicitud de archivo estático:")
        print(f"   Filename solicitado: {filename}")
        print(f"   Ruta completa: {file_path}")
        print(f"   Existe: {file_path.exists()}")
    
    if not file_path.exists():
        if not IS_PRODUCTION:
            print(f"   ❌ Archivo NO encontrado")
        return f"❌ Archivo no encontrado: {filename}", 404
    
    # Determinar mimetype
    mimetype = None
    if filename.endswith('.css'):
        mimetype = 'text/css'
    elif filename.endswith('.js'):
        mimetype = 'application/javascript'
    elif filename.endswith('.json'):
        mimetype = 'application/json'
    elif filename.endswith('.png'):
        mimetype = 'image/png'
    elif filename.endswith('.jpg') or filename.endswith('.jpeg'):
        mimetype = 'image/jpeg'
    elif filename.endswith('.svg'):
        mimetype = 'image/svg+xml'
    
    if not IS_PRODUCTION:
        print(f"   ✅ Sirviendo archivo (mimetype: {mimetype})")
    
    return send_from_directory(
        str(STATIC_DIR), 
        filename,
        mimetype=mimetype
    )


@app.route("/health")
def health():
    """Endpoint de diagnóstico"""
    from flask import session
    
    css_path = STATIC_DIR / 'css' / 'style.css'
    js_path = STATIC_DIR / 'js' / 'main.js'
    
    return jsonify({
        "status": "ok",
        "environment": "production" if IS_PRODUCTION else "development",
        "cache_size": cache_service.size(),
        "authenticated": 'account_sid' in session,
        "paths": {
            "base_dir": str(BASE_DIR),
            "frontend_dir": str(FRONTEND_DIR),
            "static_dir": str(STATIC_DIR),
            "static_exists": STATIC_DIR.exists(),
            "css_exists": css_path.exists(),
            "js_exists": js_path.exists(),
        },
        "config": {
            "port": Config.FLASK_PORT,
            "debug": Config.FLASK_DEBUG,
        }
    })


@app.after_request
def after_request(response):
    """Log todas las respuestas (solo en desarrollo)"""
    if not IS_PRODUCTION:
        print(f"📤 Respuesta: {response.status}")
    return response


if __name__ == "__main__":
    port = Config.FLASK_PORT
    debug = Config.FLASK_DEBUG
    
    print("\n🚀 Iniciando Twilio Monitor...")
    print(f"🌐 Servidor: http://0.0.0.0:{port}")
    print(f"🔧 Debug: {debug}")
    print(f"🏭 Entorno: {'PRODUCCIÓN' if IS_PRODUCTION else 'DESARROLLO'}")
    
    if not IS_PRODUCTION:
        print("\n💡 URLs de prueba:")
        print(f"   • Página: http://127.0.0.1:{port}/")
        print(f"   • Login: http://127.0.0.1:{port}/login")
        print(f"   • Health: http://127.0.0.1:{port}/health")
        print(f"   • CSS: http://127.0.0.1:{port}/static/css/style.css")
        print(f"   • JS: http://127.0.0.1:{port}/static/js/main.js")
    
    print("\n" + "="*60 + "\n")
    
    # En producción, usar 0.0.0.0 para que Render pueda acceder
    # En desarrollo, puede usar 127.0.0.1 o 0.0.0.0
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=False  # Evitar doble ejecución en debug
    )
