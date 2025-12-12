"""
Rutas HTTP para autenticación y gestión de servicios
"""
from flask import Blueprint, request, jsonify, session
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import logging

logger = logging.getLogger(__name__)


class AuthRoutes:
    """Controlador de rutas para autenticación y servicios"""
    
    def __init__(self):
        self.blueprint = Blueprint('auth', __name__)
        self._register_routes()
    
    def _register_routes(self):
        """Registra todas las rutas del blueprint"""
        self.blueprint.add_url_rule(
            '/api/login',
            'login',
            self.login,
            methods=['POST']
        )
        
        self.blueprint.add_url_rule(
            '/api/logout',
            'logout',
            self.logout,
            methods=['POST']
        )
        
        self.blueprint.add_url_rule(
            '/api/check-auth',
            'check_auth',
            self.check_auth,
            methods=['GET']
        )
        
        self.blueprint.add_url_rule(
            '/api/servicios',
            'get_services',
            self.get_services,
            methods=['GET']
        )
    
    def login(self):
        """
        Endpoint para login con credenciales de Twilio
        
        Request Body:
            {
                "account_sid": "ACXXXXXXXX",
                "auth_token": "your_auth_token"
            }
            
        Returns:
            JSON con resultado del login
        """
        try:
            data = request.get_json()
            account_sid = data.get('account_sid')
            auth_token = data.get('auth_token')
            
            if not account_sid or not auth_token:
                return jsonify({
                    'success': False,
                    'message': 'Credenciales incompletas'
                }), 400
            
            # Validar credenciales intentando conectar con Twilio
            try:
                client = Client(account_sid, auth_token)
                # Hacer una llamada simple para validar credenciales
                account = client.api.accounts(account_sid).fetch()
                
                # Guardar en sesión
                session['account_sid'] = account_sid
                session['auth_token'] = auth_token
                session['account_name'] = account.friendly_name
                session.permanent = True
                
                return jsonify({
                    'success': True,
                    'message': 'Login exitoso',
                    'account_name': account.friendly_name
                })
                
            except TwilioRestException as e:
                logger.error(f"Error de autenticación Twilio: {e}")
                return jsonify({
                    'success': False,
                    'message': 'Credenciales inválidas'
                }), 401
                
        except Exception as e:
            logger.error(f"Error en login: {e}")
            return jsonify({
                'success': False,
                'message': 'Error del servidor'
            }), 500
    
    def logout(self):
        """Endpoint para cerrar sesión"""
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Sesión cerrada'
        })
    
    def check_auth(self):
        """
        Endpoint para verificar si hay sesión activa
        
        Returns:
            JSON con estado de autenticación
        """
        is_authenticated = 'account_sid' in session and 'auth_token' in session
        
        return jsonify({
            'authenticated': is_authenticated,
            'account_name': session.get('account_name') if is_authenticated else None
        })
    
    def get_services(self):
        """
        Endpoint para obtener servicios de mensajería de Twilio
        
        Returns:
            JSON con lista de servicios (números de teléfono configurados)
        """
        if 'account_sid' not in session or 'auth_token' not in session:
            return jsonify({
                'success': False,
                'message': 'No autenticado'
            }), 401
        
        try:
            client = Client(session['account_sid'], session['auth_token'])
            
            # Obtener números de teléfono entrantes (incoming phone numbers)
            incoming_numbers = client.incoming_phone_numbers.list(limit=100)
            
            services = []
            seen_numbers = set()
            
            for number in incoming_numbers:
                base_number = number.phone_number
                
                # Evitar duplicados
                if base_number in seen_numbers:
                    continue
                seen_numbers.add(base_number)
                
                # Crear servicio con prefijo whatsapp: (asumiendo que todos usan WhatsApp)
                # Si usas SMS regular, ajusta esta lógica
                phone_number = f"whatsapp:{base_number}"
                service_type = 'WhatsApp'
                
                # Si prefieres detectar automáticamente, descomenta esto:
                # if hasattr(number, 'sms_url') and number.sms_url:
                #     if 'whatsapp' in str(number.sms_url).lower():
                #         service_type = 'WhatsApp'
                #         phone_number = f"whatsapp:{base_number}"
                #     else:
                #         service_type = 'SMS'
                #         phone_number = base_number
                
                services.append({
                    'sid': number.sid,
                    'phone_number': phone_number,
                    'friendly_name': number.friendly_name or base_number,
                    'service_type': service_type,
                    'capabilities': number.capabilities
                })
            
            return jsonify({
                'success': True,
                'services': services
            })
            
        except Exception as e:
            logger.error(f"Error al obtener servicios: {e}")
            return jsonify({
                'success': False,
                'message': 'Error al obtener servicios'
            }), 500
