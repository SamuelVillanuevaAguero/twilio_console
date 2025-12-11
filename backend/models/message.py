"""
Modelo de dominio para mensajes de Twilio
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Message:
    """Representa un mensaje de Twilio"""
    
    sid: str
    from_number: str
    to_number: str
    body: Optional[str]
    status: str
    direction: str
    date_sent: Optional[datetime]
    
    def to_dict(self) -> dict:
        """Convierte el mensaje a diccionario para JSON"""
        return {
            "sid": self.sid,
            "from": self.from_number,
            "to": self.to_number,
            "body": self.body,
            "status": self.status,
            "direction": self.direction,
            "date_sent": self.date_sent.isoformat() if self.date_sent else None
        }
    
    @classmethod
    def from_twilio_message(cls, twilio_msg, timezone_offset_hours: int = 0):
        """
        Crea una instancia de Message desde un objeto de Twilio
        
        Args:
            twilio_msg: Objeto Message de la API de Twilio
            timezone_offset_hours: Horas a restar para ajustar zona horaria
        """
        from datetime import timedelta
        
        date_sent = None
        if twilio_msg.date_sent:
            date_sent = twilio_msg.date_sent.replace(tzinfo=None)
            if timezone_offset_hours:
                date_sent -= timedelta(hours=timezone_offset_hours)
        
        return cls(
            sid=twilio_msg.sid,
            from_number=twilio_msg.from_,
            to_number=twilio_msg.to,
            body=twilio_msg.body,
            status=twilio_msg.status,
            direction=twilio_msg.direction,
            date_sent=date_sent
        )


@dataclass
class MessageFilter:
    """Representa los filtros para buscar mensajes"""
    
    sid: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_final: Optional[datetime] = None
    numero_from: Optional[str] = None
    numero_to: Optional[str] = None
    
    def matches(self, message: Message) -> bool:
        """
        Verifica si un mensaje cumple con los filtros
        
        Args:
            message: Mensaje a verificar
            
        Returns:
            True si el mensaje cumple con todos los filtros
        """
        # Filtro por SID
        if self.sid and message.sid != self.sid:
            return False
        
        # Filtros de fecha
        if message.date_sent:
            if self.fecha_inicio and message.date_sent < self.fecha_inicio:
                return False
            if self.fecha_final and message.date_sent > self.fecha_final:
                return False
        
        # Filtro por número from
        if self.numero_from and message.from_number != self.numero_from:
            return False
        
        # Filtro por número to
        if self.numero_to and message.to_number != self.numero_to:
            return False
        
        return True
    
    def to_twilio_params(self) -> dict:
        """
        Convierte los filtros a parámetros para la API de Twilio
        
        Returns:
            Diccionario con parámetros para Twilio
        """
        params = {}
        
        if self.fecha_inicio:
            params['date_sent_after'] = self.fecha_inicio
        if self.fecha_final:
            params['date_sent_before'] = self.fecha_final
        if self.numero_from:
            params['from_'] = self.numero_from
        if self.numero_to:
            params['to'] = self.numero_to
        
        return params


@dataclass
class PaginatedResponse:
    """Representa una respuesta paginada"""
    
    messages: list[Message]
    page: int
    per_page: int
    total: int
    total_pages: int
    has_more: bool
    
    def to_dict(self) -> dict:
        """Convierte la respuesta a diccionario para JSON"""
        return {
            "mensajes": [msg.to_dict() for msg in self.messages],
            "page": self.page,
            "per_page": self.per_page,
            "total": self.total,
            "total_pages": self.total_pages,
            "has_more": self.has_more
        }
