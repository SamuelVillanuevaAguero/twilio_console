/**
 * Servicio para gestionar el estado y lógica de negocio de mensajes
 */
import MessageAPI from '../api/messageAPI.js';

class MessageService {
    constructor() {
        this.currentPage = 1;
        this.messagesPerPage = 50;
        this.lastSearchParams = null;
        this.totalPages = 1;
        this.loading = false;
    }
    
    /**
     * Obtiene el estado actual
     * @returns {Object} Estado actual
     */
    getState() {
        return {
            currentPage: this.currentPage,
            messagesPerPage: this.messagesPerPage,
            totalPages: this.totalPages,
            loading: this.loading
        };
    }
    
    /**
     * Construye parámetros de búsqueda desde el formulario
     * @param {HTMLFormElement} form - Formulario con filtros
     * @param {Object} selectedService - Servicio seleccionado
     * @returns {Object} Parámetros de búsqueda
     */
    buildSearchParams(form, selectedService) {
        const formData = new FormData(form);
        const params = {
            page: this.currentPage,
            per_page: this.messagesPerPage
        };
        
        // Función auxiliar para normalizar números (agregar whatsapp: si no lo tiene)
        const normalizeNumber = (number) => {
            if (!number) return number;
            const trimmed = number.trim();
            // Si ya tiene whatsapp:, retornarlo tal cual
            if (trimmed.startsWith('whatsapp:')) return trimmed;
            // Si no, agregarlo
            return `whatsapp:${trimmed}`;
        };
        
        // Fecha inicio
        const fechaInicio = formData.get('fecha_inicio');
        if (fechaInicio) {
            params.fecha_inicio = fechaInicio;
        }
        
        // Fecha final
        const fechaFinal = formData.get('fecha_final');
        if (fechaFinal) {
            params.fecha_final = fechaFinal;
        }
        
        // Obtener valores de filtros manuales
        const numeroFrom = formData.get('numero_from');
        const numeroTo = formData.get('numero_to');
        const numeroFromTo = formData.get('numero_from_to');
        
        // SID
        const sid = formData.get('sid');
        if (sid) {
            params.sid = sid;
            return params; // Si hay SID, ignorar otros filtros
        }
        
        // LÓGICA DE FILTRADO INTELIGENTE CON SERVICIO SELECCIONADO
        if (selectedService) {
            const serviceNumber = selectedService.phone_number;
            
            // CASO 1: Filtro manual "De o Para" + Servicio seleccionado
            // Queremos: Conversaciones entre el SERVICIO y el USUARIO específico
            if (numeroFromTo) {
                const userNumber = normalizeNumber(numeroFromTo);
                // Marcar para búsqueda especial (dos búsquedas en paralelo)
                params.service_user_conversation = true;
                params.service_number = serviceNumber;
                params.user_number = userNumber;
                return params;
            }
            
            // CASO 2: Filtro manual "De" + Servicio seleccionado
            if (numeroFrom) {
                const fromNumber = normalizeNumber(numeroFrom);
                // Si el "De" es el servicio, buscar mensajes DEL servicio
                // Si es otro número, buscar mensajes de ese número HACIA el servicio
                if (fromNumber === serviceNumber) {
                    params.from = serviceNumber;
                } else {
                    params.from = fromNumber;
                    params.to = serviceNumber;
                }
                return params;
            }
            
            // CASO 3: Filtro manual "Para" + Servicio seleccionado
            if (numeroTo) {
                const toNumber = normalizeNumber(numeroTo);
                // Si el "Para" es el servicio, buscar mensajes HACIA el servicio
                // Si es otro número, buscar mensajes del servicio hacia ese número
                if (toNumber === serviceNumber) {
                    params.to = serviceNumber;
                } else {
                    params.from = serviceNumber;
                    params.to = toNumber;
                }
                return params;
            }
            
            // CASO 4: Solo servicio seleccionado, sin filtros manuales
            params.from_to = serviceNumber;
            return params;
        }
        
        // Sin servicio seleccionado, usar filtros normales
        if (numeroFrom) {
            params.from = normalizeNumber(numeroFrom);
        }
        
        if (numeroTo) {
            params.to = normalizeNumber(numeroTo);
        }
        
        if (numeroFromTo) {
            params.from_to = normalizeNumber(numeroFromTo);
        }
        
        return params;
    }
    
    /**
     * Busca mensajes con los filtros actuales
     * @param {Object} searchParams - Parámetros de búsqueda
     * @returns {Promise<Object>} Respuesta del servidor
     */
    async searchMessages(searchParams) {
        if (this.loading) {
            return null;
        }
        
        this.loading = true;
        this.lastSearchParams = searchParams;
        
        try {
            const response = await MessageAPI.fetchMessages(searchParams);
            this.totalPages = response.total_pages;
            return response;
        } finally {
            this.loading = false;
        }
    }
    
    /**
     * Cambia a una página específica
     * @param {number} pageNumber - Número de página
     */
    setPage(pageNumber) {
        this.currentPage = pageNumber;
    }
    
    /**
     * Establece mensajes por página
     * @param {number} perPage - Cantidad de mensajes
     */
    setMessagesPerPage(perPage) {
        this.messagesPerPage = perPage;
        this.currentPage = 1; // Resetear a primera página
    }
    
    /**
     * Resetea los filtros de búsqueda
     */
    resetSearch() {
        this.currentPage = 1;
        this.lastSearchParams = null;
    }
}

export default MessageService;
