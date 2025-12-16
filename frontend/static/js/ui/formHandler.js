/**
 * Manejador de formularios y controles
 */
class FormHandler {
    constructor(formId, onSearch, onClear, onExport) {
        this.form = document.getElementById(formId);
        this.onSearch = onSearch;
        this.onClear = onClear;
        this.onExport = onExport;
        
        this._setupEventListeners();
    }
    
    /**
     * Configura los event listeners
     */
    _setupEventListeners() {
        // Enter en campos de búsqueda
        const inputs = this.form.querySelectorAll('.search-input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.onSearch();
                }
            });
        });
    }
    
    /**
     * Obtiene el valor del campo de cantidad de mensajes
     * @returns {number} Cantidad de mensajes por página
     */
    getMessagesPerPage() {
        return parseInt(document.getElementById("cantidad").value);
    }
    
    /**
     * Obtiene los datos del formulario
     * @returns {FormData} Datos del formulario
     */
    getFormData() {
        return new FormData(this.form);
    }
    
    /**
     * Limpia todos los campos del formulario
     */
    clear() {
        document.getElementById("sid").value = "";
        document.getElementById("fecha_inicio").value = "";
        document.getElementById("fecha_final").value = "";
        document.getElementById("numero_from").value = "";
        document.getElementById("numero_to").value = "";
        document.getElementById("numero_from_to").value = "";
        document.getElementById("body_search").value = ""; // Nuevo campo
        document.getElementById("cantidad").value = "50";
    }
    
    /**
     * Muestra/oculta indicador de carga
     * @param {boolean} show - Mostrar o ocultar
     */
    toggleLoadingIndicator(show) {
        const indicator = document.getElementById("loading-indicator");
        
        if (show) {
            indicator.classList.remove("d-none");
        } else {
            indicator.classList.add("d-none");
        }
    }
}

export default FormHandler;