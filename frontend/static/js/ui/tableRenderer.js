/**
 * Renderizador de tabla de mensajes
 */
import DateFormatter from '../utils/dateFormatter.js';

class TableRenderer {
    constructor(tableId, servicesService) {
        this.table = document.getElementById(tableId);
        this.servicesService = servicesService;
    }
    
    /**
     * Renderiza los mensajes en la tabla
     * @param {Array} messages - Lista de mensajes
     */
    render(messages) {
        this.table.innerHTML = "";
        
        if (messages.length === 0) {
            this._renderEmpty();
            return;
        }
        
        messages.forEach(message => {
            const row = this._createRow(message);
            this.table.appendChild(row);
        });
    }
    
    /**
     * Muestra mensaje de tabla vacía
     */
    _renderEmpty() {
        const isMobile = window.innerWidth < 577;
        const colspan = isMobile ? "3" : "5";
        
        this.table.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="text-center text-muted py-4">
                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                    <div class="mt-2">No se encontraron mensajes</div>
                    <small class="text-muted">Intenta ajustar los filtros de búsqueda</small>
                </td>
            </tr>
        `;
    }
    
    /**
     * Muestra indicador de carga
     */
    renderLoading() {
        const isMobile = window.innerWidth < 577;
        const colspan = isMobile ? "3" : "5";
        
        this.table.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <div class="mt-2 text-muted">Cargando mensajes...</div>
                </td>
            </tr>
        `;
    }
    
    /**
     * Muestra mensaje de error
     * @param {string} errorMessage - Mensaje de error
     */
    renderError(errorMessage) {
        const isMobile = window.innerWidth < 577;
        const colspan = isMobile ? "3" : "5";
        
        this.table.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                    <div class="mt-2">
                        ${errorMessage || 'Error al cargar mensajes'}
                    </div>
                    <small class="text-muted">Por favor, intenta nuevamente</small>
                </td>
            </tr>
        `;
    }
    
    /**
     * Crea una fila de la tabla para un mensaje
     * @param {Object} message - Datos del mensaje
     * @returns {HTMLTableRowElement} Fila de la tabla
     */
    _createRow(message) {
        const { dateMain, dateTime } = DateFormatter.formatMessageDate(message.date_sent);
        const { bubbleClass, alignmentClass } = this._getMessageStyle(message.from);
        const statusClass = this._getStatusClass(message.status);
        const body = message.body || "<i>Sin contenido</i>";
        
        const row = document.createElement('tr');
        row.className = alignmentClass;
        
        // Versión móvil vs desktop
        const isMobile = window.innerWidth < 577;
        
        if (isMobile) {
            // Versión móvil: solo fecha, body y status
            row.innerHTML = `
                <td>
                    <div class="date-block">
                        <span class="date-main">${dateMain}</span>
                        <span class="date-time">${dateTime}</span>
                    </div>
                </td>
                <td>
                    <div class="${bubbleClass}">${body}</div>
                    <small class="text-muted d-block mt-1">
                        <i class="bi bi-arrow-right-circle"></i> ${this._truncateNumber(message.from)}
                        →
                        <i class="bi bi-arrow-left-circle"></i> ${this._truncateNumber(message.to)}
                    </small>
                </td>
                <td>
                    <span class="${statusClass}">${message.status}</span>
                </td>
            `;
        } else {
            // Versión desktop: todas las columnas
            row.innerHTML = `
                <td>
                    <div class="date-block">
                        <span class="date-main">${dateMain}</span>
                        <span class="date-time">${dateTime}</span>
                    </div>
                </td>
                <td><span class="endpoint from-number">${message.from}</span></td>
                <td><span class="endpoint to-number">${message.to}</span></td>
                <td>
                    <div class="${bubbleClass}">${body}</div>
                </td>
                <td>
                    <span class="${statusClass}">${message.status}</span>
                </td>
            `;
        }
        
        return row;
    }
    
    /**
     * Trunca un número de teléfono para móviles
     * @param {string} number - Número completo
     * @returns {string} Número truncado
     */
    _truncateNumber(number) {
        if (!number) return '';
        
        // Si tiene whatsapp:, quitarlo
        let cleaned = number.replace('whatsapp:', '');
        
        // Si es muy largo, mostrar solo últimos 4 dígitos
        if (cleaned.length > 10) {
            return '...' + cleaned.slice(-4);
        }
        
        return cleaned;
    }
    
    /**
     * Determina el estilo del mensaje según el remitente y servicio
     * @param {string} from - Número del remitente
     * @returns {Object} Clases CSS para la burbuja y alineación
     */
    _getMessageStyle(from) {
        const selectedService = this.servicesService.getSelectedService();
        const isBot = selectedService && from === selectedService.phone_number;
        
        // Obtener índice del servicio para aplicar estilos específicos
        const serviceIndex = selectedService 
            ? this.servicesService.getServiceIndex(selectedService.phone_number)
            : 0;
        
        return {
            bubbleClass: isBot 
                ? `bubble-bot-service-${serviceIndex}` 
                : `bubble-user-service-${serviceIndex}`,
            alignmentClass: isBot ? "align-right" : ""
        };
    }
    
    /**
     * Determina la clase CSS según el estado del mensaje
     * @param {string} status - Estado del mensaje
     * @returns {string} Clase CSS completa
     */
    _getStatusClass(status) {
        const baseClass = "status-pill ";
        const statusMap = {
            "received": "status-received",
            "failed": "status-failed",
            "sent": "status-sent",
            "queued": "status-queued",
            "delivered": "status-received"
        };
        
        return baseClass + (statusMap[status] || "status-queued");
    }
}

export default TableRenderer;