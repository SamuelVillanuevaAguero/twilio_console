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
        
        // Número from
        const numeroFrom = formData.get('numero_from');
        if (numeroFrom) {
            params.from = normalizeNumber(numeroFrom);
        }
        
        // Número to
        const numeroTo = formData.get('numero_to');
        if (numeroTo) {
            params.to = normalizeNumber(numeroTo);
        }

        // Número from o to
        const numeroFromTo = formData.get('numero_from_to');
        if (numeroFromTo) {
            params.from_to = normalizeNumber(numeroFromTo);
        }
        
        // SID
        const sid = formData.get('sid');
        if (sid) {
            params.sid = sid;
        }
        
        // FILTRO AUTOMÁTICO POR SERVICIO SELECCIONADO
        // Si hay un servicio seleccionado y NO hay filtros manuales de números,
        // filtrar automáticamente por el número del servicio (mensajes enviados O recibidos)
        if (selectedService && !numeroFrom && !numeroTo && !numeroFromTo) {
            // El número del servicio ya viene con el prefijo whatsapp: desde el backend
            params.from_to = selectedService.phone_number;
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
