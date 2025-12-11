/**
 * Aplicación principal
 * Orquesta todos los componentes del frontend
 */
import MessageService from './services/messageService.js';
import TableRenderer from './ui/tableRenderer.js';
import PaginationRenderer from './ui/paginationRenderer.js';
import FormHandler from './ui/formHandler.js';
import CSVExporter from './utils/csvExporter.js';

class TwilioMonitorApp {
    constructor(botNumber) {
        // Inicializar servicios
        this.messageService = new MessageService();
        
        // Inicializar componentes UI
        this.tableRenderer = new TableRenderer('tabla-mensajes', botNumber);
        this.paginationRenderer = new PaginationRenderer(
            'paginador',
            'info-resultados',
            (page) => this.changePage(page)
        );
        this.formHandler = new FormHandler(
            'search-form',
            () => this.search(),
            () => this.clearFilters(),
            () => this.exportCSV()
        );
    }
    
    /**
     * Inicia la aplicación
     */
    async init() {
        await this.search();
    }
    
    /**
     * Realiza una búsqueda con los filtros actuales
     */
    async search() {
        // Actualizar configuración
        console.log("Iniciando búsqueda de mensajes...");
        const messagesPerPage = this.formHandler.getMessagesPerPage();
        this.messageService.setMessagesPerPage(messagesPerPage);
        this.messageService.setPage(1);
        
        await this.loadCurrentPage();
    }
    
    /**
     * Cambia a una página específica
     * @param {number} pageNumber - Número de página
     */
    async changePage(pageNumber) {
        if (this.messageService.getState().loading) {
            return;
        }
        
        this.messageService.setPage(pageNumber);
        await this.loadCurrentPage();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * Carga la página actual
     */
    async loadCurrentPage() {
        const state = this.messageService.getState();
        
        if (state.loading) {
            return;
        }
        
        // Mostrar indicadores de carga
        this.formHandler.toggleLoadingIndicator(true);
        this.tableRenderer.renderLoading();
        
        try {
            // Construir parámetros de búsqueda
            const searchParams = this.messageService.buildSearchParams(
                this.formHandler.form
            );
            console.log("Cargando página con parámetros:", searchParams);
            
            // Buscar mensajes
            const response = await this.messageService.searchMessages(searchParams);
            
            if (!response) {
                return; // Ya hay una búsqueda en progreso
            }
            
            // Renderizar resultados
            this.tableRenderer.render(response.mensajes);
            this.paginationRenderer.render(
                response.page,
                response.total_pages,
                response.has_more
            );
            this.paginationRenderer.renderInfo(response);
            
        } catch (error) {
            console.error("Error al cargar página:", error);
            this.tableRenderer.renderError();
            
        } finally {
            this.formHandler.toggleLoadingIndicator(false);
        }
    }
    
    /**
     * Limpia todos los filtros
     */
    clearFilters() {
        this.formHandler.clear();
        this.messageService.resetSearch();
        this.search();
    }
    
    /**
     * Exporta la tabla actual a CSV
     */
    exportCSV() {
        CSVExporter.exportTable('tabla-mensajes');
    }
}

// Inicializar aplicación cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    const app = new TwilioMonitorApp(window.NUMERO_TWILIO);
    app.init();
    
    // Exponer funciones globales para los event handlers en HTML
    window.buscar = () => app.search();
    window.limpiarFiltros = () => app.clearFilters();
    window.exportarCSV = () => app.exportCSV();
});
