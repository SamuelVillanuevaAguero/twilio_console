"""
Servicio de caché para almacenar resultados de consultas
"""
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Any


class CacheService:
    """Servicio para cachear consultas y reducir llamadas a la API"""
    
    def __init__(self, ttl_seconds: int = 300):
        """
        Inicializa el servicio de caché
        
        Args:
            ttl_seconds: Tiempo de vida del caché en segundos
        """
        self._cache = {}
        self._ttl_seconds = ttl_seconds
    
    def _generate_key(self, params: dict) -> str:
        """
        Genera una clave única basada en los parámetros
        
        Args:
            params: Diccionario con los parámetros de consulta
            
        Returns:
            Hash MD5 de los parámetros
        """
        key_str = json.dumps(params, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, params: dict) -> Optional[Any]:
        """
        Obtiene un valor del caché si existe y no ha expirado
        
        Args:
            params: Parámetros de consulta
            
        Returns:
            El valor cacheado o None si no existe o expiró
        """
        key = self._generate_key(params)
        
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        age = (datetime.now() - entry['timestamp']).total_seconds()
        
        if age > self._ttl_seconds:
            del self._cache[key]
            return None
        
        return entry['data']
    
    def set(self, params: dict, value: Any) -> None:
        """
        Almacena un valor en el caché
        
        Args:
            params: Parámetros de consulta (usados como clave)
            value: Valor a almacenar
        """
        key = self._generate_key(params)
        self._cache[key] = {
            'data': value,
            'timestamp': datetime.now()
        }
    
    def clear_expired(self) -> int:
        """
        Limpia las entradas expiradas del caché
        
        Returns:
            Número de entradas eliminadas
        """
        now = datetime.now()
        keys_to_delete = []
        
        for key, entry in self._cache.items():
            age = (now - entry['timestamp']).total_seconds()
            if age > self._ttl_seconds:
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self._cache[key]
        
        return len(keys_to_delete)
    
    def clear(self) -> None:
        """Limpia todo el caché"""
        self._cache.clear()
    
    def size(self) -> int:
        """Retorna el tamaño actual del caché"""
        return len(self._cache)
