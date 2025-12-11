/**
 * Cliente API para comunicación con el backend
 */
class MessageAPI {
    /**
     * Obtiene mensajes con filtros y paginación
     * @param {Object} params - Parámetros de consulta
     * @param {number} params.page - Número de página
     * @param {number} params.per_page - Mensajes por página
     * @param {string} [params.fecha_inicio] - Fecha de inicio
     * @param {string} [params.fecha_final] - Fecha final
     * @param {string} [params.from] - Número from
     * @param {string} [params.to] - Número to
     * @param {string} [params.from_to] - Número para buscar en from y to simultáneamente
     * @param {string} [params.sid] - Message SID
     * @returns {Promise<Object>} Respuesta del servidor
     */
    static async fetchMessages(params) {
        try {
            // Si existe from_to, hacer dos peticiones en paralelo
            if (params.from_to) {
                const from_to = params.from_to;
                
                // Crear copia de params sin from_to
                const baseParams = { ...params };
                delete baseParams.from_to;
                
                // Hacer dos peticiones en paralelo
                const [responseFrom, responseTo] = await Promise.all([
                    this._fetchWithParams({ ...baseParams, from: from_to }),
                    this._fetchWithParams({ ...baseParams, to: from_to })
                ]);
                
                // Combinar y retornar resultados
                return this._mergeResults(responseFrom, responseTo);
            } else {
                // Petición normal sin from_to
                return await this._fetchWithParams(params);
            }
        } catch (error) {
            console.error("Error al cargar mensajes:", error);
            throw error;
        }
    }

    /**
     * Realiza una petición fetch con los parámetros dados
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise<Object>} Respuesta del servidor
     */
    static async _fetchWithParams(params) {
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                queryParams.append(key, value);
            }
        });
        
        console.log("Fetching messages with params:", queryParams.toString());
        const response = await fetch(`/mensajes?${queryParams.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Response received:", data);
        return data;
    }

    /**
     * Combina resultados de dos peticiones
     * @param {Object} responseFrom - Respuesta de petición con from
     * @param {Object} responseTo - Respuesta de petición con to
     * @returns {Object} Resultados combinados
     */
    static _mergeResults(responseFrom, responseTo) {
        // Combinar los mensajes de ambas respuestas, eliminando duplicados por SID
        const allMessages = [...(responseFrom.mensajes || responseFrom.data || []), ...(responseTo.mensajes || responseTo.data || [])];
        const uniqueMessages = [];
        const seenSids = new Set();
        
        for (const message of allMessages) {
            if (!seenSids.has(message.sid)) {
                uniqueMessages.push(message);
                seenSids.add(message.sid);
            }
        }
        
        // Ordenar por fecha (más recientes primero). Maneja valores faltantes.
        uniqueMessages.sort((a, b) => {
            const da = a && a.date_sent ? new Date(a.date_sent) : new Date(0);
            const db = b && b.date_sent ? new Date(b.date_sent) : new Date(0);
            return db - da;
        });

        // Retornar la respuesta con la estructura del primer resultado
        return {
            ...responseFrom,
            mensajes: uniqueMessages,
            total: uniqueMessages.length
        };
    }
}

export default MessageAPI;
