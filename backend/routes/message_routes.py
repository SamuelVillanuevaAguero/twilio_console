"""
Rutas HTTP para gestión de mensajes
"""
from flask import Blueprint, request, jsonify, session
from datetime import timedelta

from ..models.message import MessageFilter
from ..utils.date_utils import parse_datetime
from ..services.twilio_service import TwilioService
from ..services.cache_service import CacheService
from ..config import Config


class MessageRoutes:
    """Controlador de rutas para mensajes"""
    
    def __init__(self, cache_service: CacheService):
        """
        Inicializa las rutas con las dependencias necesarias
        
        Args:
            cache_service: Servicio de caché
        """
        self.cache_service = cache_service
        self.blueprint = Blueprint('messages', __name__)
        self._register_routes()
    
    def _register_routes(self):
        """Registra todas las rutas del blueprint"""
        self.blueprint.add_url_rule(
            '/mensajes',
            'get_messages',
            self.get_messages,
            methods=['GET']
        )
    
    def _get_twilio_service(self):
        """
        Crea una instancia de TwilioService con las credenciales de sesión
        
        Returns:
            TwilioService o None si no hay sesión activa
        """
        if 'account_sid' not in session or 'auth_token' not in session:
            return None
        
        return TwilioService(
            account_sid=session['account_sid'],
            auth_token=session['auth_token'],
            timezone_offset_hours=Config.TIMEZONE_OFFSET_HOURS,
            page_size=Config.TWILIO_PAGE_SIZE
        )
    
    def get_messages(self):
        """
        Endpoint para obtener mensajes paginados con filtros
        
        Query Parameters:
            - page: Número de página (default: 1)
            - per_page: Mensajes por página (default: 50, max: 100)
            - fecha_inicio: Fecha de inicio (ISO format)
            - fecha_final: Fecha final (ISO format)
            - from: Número de origen
            - to: Número de destino
            - sid: SID del mensaje
            - body_search: Búsqueda por contenido del mensaje
            - service: Número del servicio (opcional)
            
        Returns:
            JSON con mensajes paginados
        """
        # Verificar autenticación
        twilio_service = self._get_twilio_service()
        if not twilio_service:
            return jsonify({
                'error': 'No autenticado',
                'mensajes': [],
                'page': 1,
                'per_page': 50,
                'total': 0,
                'total_pages': 0,
                'has_more': False
            }), 401
        
        # Limpiar caché expirado periódicamente
        self.cache_service.clear_expired()
        
        # Verificar caché
        cache_key = dict(request.args)
        cache_key['account_sid'] = session['account_sid']  # Incluir SID en caché
        cached_response = self.cache_service.get(cache_key)
        
        if cached_response:
            return jsonify(cached_response)
        
        # Parsear parámetros de paginación
        page = int(request.args.get("page", 1))
        per_page = min(
            int(request.args.get("per_page", Config.DEFAULT_MESSAGES_PER_PAGE)),
            Config.MAX_MESSAGES_PER_PAGE
        )
        
        # Parsear filtros
        filters = self._parse_filters(request.args)
        
        # Obtener mensajes
        try:
            response = twilio_service.get_paginated_messages(
                filters,
                page,
                per_page
            )
            
            response_dict = response.to_dict()
            
            # Guardar en caché
            self.cache_service.set(cache_key, response_dict)
            
            return jsonify(response_dict)
            
        except Exception as e:
            return jsonify({
                "error": f"Error al consultar mensajes: {str(e)}",
                "mensajes": [],
                "page": page,
                "per_page": per_page,
                "total": 0,
                "total_pages": 0,
                "has_more": False
            }), 500
    
    def _parse_filters(self, args) -> MessageFilter:
        """
        Parsea los parámetros de consulta a un objeto MessageFilter
        
        Args:
            args: Argumentos de la petición (request.args)
            
        Returns:
            Objeto MessageFilter con los filtros parseados
        """
        # Parsear fecha final y ajustar zona horaria
        fecha_final = parse_datetime(args.get("fecha_final"))
        if fecha_final:
            fecha_final += timedelta(hours=Config.TIMEZONE_OFFSET_HOURS)
        
        return MessageFilter(
            sid=args.get("sid"),
            fecha_inicio=parse_datetime(args.get("fecha_inicio")),
            fecha_final=fecha_final,
            numero_from=args.get("from"),
            numero_to=args.get("to"),
            body_search=args.get("body_search")  # Nuevo parámetro
        )