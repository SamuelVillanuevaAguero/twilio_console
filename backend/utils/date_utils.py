"""
Utilidades para manejo de fechas
"""
from datetime import datetime
from typing import Optional


def parse_datetime(date_string: Optional[str]) -> Optional[datetime]:
    """
    Parsea una cadena de fecha a objeto datetime
    
    Args:
        date_string: Cadena con formato ISO (YYYY-MM-DDTHH:MM o YYYY-MM-DD)
        
    Returns:
        Objeto datetime o None si no se puede parsear
    """
    if not date_string:
        return None
    
    # Formato con hora
    try:
        return datetime.strptime(date_string, "%Y-%m-%dT%H:%M")
    except ValueError:
        pass
    
    # Formato solo fecha
    try:
        return datetime.strptime(date_string, "%Y-%m-%d")
    except ValueError:
        pass
    
    return None
