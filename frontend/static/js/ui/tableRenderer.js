/**
 * Renderizador de tabla de mensajes
 */
import DateFormatter from '../utils/dateFormatter.js';

class TableRenderer {
    constructor(tableId, botNumber) {
        this.table = document.getElementById(tableId);
        this.botNumber = botNumber;
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
        this.table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No se encontraron mensajes
                </td>
            </tr>
        `;
    }
    
    /**
     * Muestra indicador de carga
     */
    renderLoading() {
        this.table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    /**
     * Muestra mensaje de error
     * @param {string} errorMessage - Mensaje de error
     */
    renderError(errorMessage) {
        this.table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    ${errorMessage || 'Error al cargar mensajes. Por favor, intenta nuevamente.'}
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
        
        return row;
    }
    
    /**
     * Determina el estilo del mensaje según el remitente
     * @param {string} from - Número del remitente
     * @returns {Object} Clases CSS para la burbuja y alineación
     */
    _getMessageStyle(from) {
        const isBot = from === this.botNumber;
        
        return {
            bubbleClass: isBot ? "bubble-bot" : "bubble-user",
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
            "queued": "status-queued"
        };
        
        return baseClass + (statusMap[status] || "status-queued");
    }
}

export default TableRenderer;
