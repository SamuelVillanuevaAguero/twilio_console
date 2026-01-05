"""
Servicio para interactuar con la API de Twilio
"""
from twilio.rest import Client
from typing import Optional
import logging

from ..models.message import Message, MessageFilter, PaginatedResponse


logger = logging.getLogger(__name__)


class TwilioService:
    """Servicio para consultar mensajes de Twilio"""
    
    def __init__(self, account_sid: str, auth_token: str, 
                 timezone_offset_hours: int = 0, page_size: int = 100):
        """
        Inicializa el servicio de Twilio
        
        Args:
            account_sid: SID de la cuenta de Twilio
            auth_token: Token de autenticación
            timezone_offset_hours: Horas a restar para ajuste de zona horaria
            page_size: Tamaño de página para consultas a Twilio
        """
        self._client = Client(account_sid, auth_token)
        self._timezone_offset = timezone_offset_hours
        self._page_size = page_size
    
    def get_message_by_sid(self, sid: str) -> Optional[Message]:
        """
        Obtiene un mensaje específico por su SID
        
        Args:
            sid: SID del mensaje
            
        Returns:
            Mensaje encontrado o None si no existe
        """
        try:
            twilio_msg = self._client.messages(sid).fetch()
            return Message.from_twilio_message(twilio_msg, self._timezone_offset)
        except Exception as e:
            logger.error(f"Error al obtener mensaje con SID {sid}: {e}")
            return None
    
    def get_paginated_messages(
        self,
        filters: MessageFilter,
        page: int = 1,
        per_page: int = 50
    ) -> PaginatedResponse:
        """
        Obtiene mensajes paginados aplicando filtros
        
        Args:
            filters: Filtros a aplicar
            page: Número de página (empieza en 1)
            per_page: Mensajes por página
            
        Returns:
            Respuesta paginada con mensajes
        """
        # Si hay SID específico, búsqueda directa
        if filters.sid:
            message = self.get_message_by_sid(filters.sid)
            messages = [message] if message and filters.matches(message) else []
            
            # Calcular usuarios únicos (excluir el servicio)
            unique_users = self._count_unique_users(messages, filters)
            
            return PaginatedResponse(
                messages=messages,
                page=1,
                per_page=per_page,
                total=len(messages),
                total_pages=1,
                has_more=False,
                unique_users=unique_users
            )
        
        # Búsqueda paginada
        return self._fetch_paginated_messages(filters, page, per_page)
    
    def _fetch_paginated_messages(
        self,
        filters: MessageFilter,
        page: int,
        per_page: int
    ) -> PaginatedResponse:
        """
        Realiza la búsqueda paginada en Twilio
        
        Args:
            filters: Filtros a aplicar
            page: Número de página
            per_page: Mensajes por página
            
        Returns:
            Respuesta paginada
        """
        results = []
        messages_processed = 0
        target_start = (page - 1) * per_page
        target_end = target_start + per_page
        
        # Para contar usuarios únicos en toda la búsqueda
        all_matching_messages = []
        
        try:
            # Obtener parámetros para Twilio
            twilio_params = filters.to_twilio_params()
            
            # Stream de mensajes
            messages_stream = self._client.messages.stream(
                page_size=self._page_size,
                limit=target_end + 1000,  # Buffer para filtros adicionales
                **twilio_params
            )
            
            for twilio_msg in messages_stream:
                message = Message.from_twilio_message(
                    twilio_msg, 
                    self._timezone_offset
                )
                
                if filters.matches(message):
                    # Guardar todos los mensajes que coinciden para contar usuarios
                    all_matching_messages.append(message)
                    
                    if messages_processed >= target_start and len(results) < per_page:
                        results.append(message)
                    
                    messages_processed += 1
                    
                    # Optimización: salir si ya tenemos suficientes
                    if len(results) >= per_page and messages_processed > target_end:
                        break
            
            # Calcular usuarios únicos (excluir el servicio)
            unique_users = self._count_unique_users(all_matching_messages, filters)
            
            # Calcular total de páginas (estimado)
            total_pages = max(
                (messages_processed + per_page - 1) // per_page,
                page
            )
            has_more = len(results) == per_page
            
            return PaginatedResponse(
                messages=results,
                page=page,
                per_page=per_page,
                total=messages_processed,
                total_pages=total_pages,
                has_more=has_more,
                unique_users=unique_users
            )
            
        except Exception as e:
            logger.error(f"Error al consultar mensajes: {e}")
            return PaginatedResponse(
                messages=[],
                page=page,
                per_page=per_page,
                total=0,
                total_pages=0,
                has_more=False,
                unique_users=0
            )
    
    def _count_unique_users(self, messages: list[Message], filters: MessageFilter) -> int:
        """
        Cuenta el número de usuarios únicos que interactuaron
        
        Excluye el número del servicio (que puede estar en filters.numero_from o numero_to)
        y cuenta solo los números de usuarios únicos.
        
        Args:
            messages: Lista de mensajes a analizar
            filters: Filtros aplicados (para identificar el número del servicio)
            
        Returns:
            Número de usuarios únicos
        """
        if not messages:
            return 0
        
        # Identificar el número del servicio
        # El servicio puede estar en from o to dependiendo del filtro
        service_numbers = set()
        
        # Si hay un filtro from_to, probablemente sea el servicio
        # En el contexto de la app, el servicio es el que filtramos
        if filters.numero_from:
            service_numbers.add(filters.numero_from)
        if filters.numero_to:
            service_numbers.add(filters.numero_to)
        
        # Si no hay filtros específicos, intentar detectar el servicio
        # (el que aparece más frecuentemente)
        if not service_numbers:
            from collections import Counter
            all_numbers = [msg.from_number for msg in messages] + [msg.to_number for msg in messages]
            number_counts = Counter(all_numbers)
            if number_counts:
                # El número más frecuente probablemente sea el servicio
                most_common = number_counts.most_common(1)[0][0]
                service_numbers.add(most_common)
        
        # Recolectar todos los números únicos, excluyendo los del servicio
        user_numbers = set()
        for msg in messages:
            if msg.from_number not in service_numbers:
                user_numbers.add(msg.from_number)
            if msg.to_number not in service_numbers:
                user_numbers.add(msg.to_number)
        
        return len(user_numbers)