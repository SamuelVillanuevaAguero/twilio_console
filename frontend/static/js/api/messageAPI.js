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
     * @param {string} [params.sid] - Message SID
     * @returns {Promise<Object>} Respuesta del servidor
     */
    static async fetchMessages(params) {
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                queryParams.append(key, value);
            }
        });
        
        try {
            const response = await fetch(`/mensajes?${queryParams.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Error al cargar mensajes:", error);
            throw error;
        }
    }
}

export default MessageAPI;
