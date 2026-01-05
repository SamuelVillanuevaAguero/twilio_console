/**
 * Aplicación principal
 * Orquesta todos los componentes del frontend
 */
import MessageService from './services/messageService.js';
import TableRenderer from './ui/tableRenderer.js';
import PaginationRenderer from './ui/paginationRenderer.js';
import StatsRenderer from './ui/statsRenderer.js';
import FormHandler from './ui/formHandler.js';
import CSVExporter from './utils/csvExporter.js';
import AuthService from './services/authService.js';
import ServicesService from './services/servicesService.js';

class TwilioMonitorApp {
    constructor() {
        // Inicializar servicios
        this.messageService = new MessageService();
        this.servicesService = new ServicesService();
        
        // Inicializar componentes UI
        this.tableRenderer = new TableRenderer('tabla-mensajes', this.servicesService);
        this.paginationRenderer = new PaginationRenderer(
            'paginador',
            'info-resultados',
            (page) => this.changePage(page)
        );
        this.statsRenderer = new StatsRenderer('stats-container');
        this.formHandler = new FormHandler(
            'search-form',
            () => this.search(),
            () => this.clearFilters(),
            () => this.exportCSV()
        );
        
        // Elementos del DOM
        this.serviceSelector = document.getElementById('service-selector');
        this.serviceInfo = document.getElementById('service-info');
        this.serviceInfoName = document.getElementById('service-info-name');
        this.serviceInfoNumber = document.getElementById('service-info-number');
        this.accountNameElement = document.getElementById('account-name');
    }
    
    /**
     * Inicia la aplicación
     */
    async init() {
        // Verificar autenticación
        const authStatus = await AuthService.checkAuth();
        if (!authStatus.authenticated) {
            window.location.href = '/login';
            return;
        }
        
        // Mostrar nombre de cuenta
        if (authStatus.account_name) {
            this.accountNameElement.textContent = authStatus.account_name;
        }
        
        // Cargar servicios
        await this.loadServices();
        
        // Configurar event listener del selector
        this.serviceSelector.addEventListener('change', () => {
            this.onServiceChange();
        });
    }
    
    /**
     * Carga los servicios disponibles
     */
    async loadServices() {
        try {
            const services = await this.servicesService.fetchServices();
            
            if (services.length === 0) {
                this.serviceSelector.innerHTML = '<option value="">No hay servicios disponibles</option>';
                return;
            }
            
            // Llenar el selector
            this.serviceSelector.innerHTML = '';
            services.forEach((service, index) => {
                const option = document.createElement('option');
                option.value = service.phone_number;
                option.textContent = `${service.friendly_name} (${service.service_type})`;
                this.serviceSelector.appendChild(option);
                
                // Seleccionar el primero por defecto
                if (index === 0) {
                    option.selected = true;
                }
            });
            
            // Establecer servicio inicial
            this.onServiceChange();
            
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            this.serviceSelector.innerHTML = '<option value="">Error al cargar servicios</option>';
        }
    }
    
    /**
     * Maneja el cambio de servicio seleccionado
     */
    onServiceChange() {
        const selectedValue = this.serviceSelector.value;
        
        if (!selectedValue) {
            this.serviceInfo.classList.add('d-none');
            return;
        }
        
        // Actualizar servicio seleccionado
        this.servicesService.setSelectedService(selectedValue);
        const service = this.servicesService.getSelectedService();
        
        if (service) {
            // Mostrar información del servicio
            this.serviceInfoName.textContent = service.friendly_name;
            this.serviceInfoNumber.textContent = service.phone_number;
            this.serviceInfo.classList.remove('d-none');
            
            // Recargar mensajes con el nuevo servicio
            this.search();
        }
    }
    
    /**
     * Realiza una búsqueda con los filtros actuales
     */
    async search() {
        // Verificar que haya un servicio seleccionado
        if (!this.servicesService.getSelectedService()) {
            console.log('No hay servicio seleccionado');
            return;
        }
        
        console.log("Iniciando búsqueda de mensajes...");
        const messagesPerPage = this.formHandler.getMessagesPerPage();
        this.messageService.setMessagesPerPage(messagesPerPage);
        this.messageService.setPage(1);
        
        await this.loadCurrentPage();
    }
    
    /**
     * Cambia a una página específica
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
        this.statsRenderer.clear();
        
        try {
            // Construir parámetros de búsqueda
            const searchParams = this.messageService.buildSearchParams(
                this.formHandler.form,
                this.servicesService.getSelectedService()
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
            
            // Renderizar estadísticas (NUEVO)
            this.statsRenderer.render(response);
            
        } catch (error) {
            console.error("Error al cargar página:", error);
            
            // Si es error de autenticación, redirigir a login
            if (error.message && error.message.includes('401')) {
                window.location.href = '/login';
                return;
            }
            
            this.tableRenderer.renderError();
            this.statsRenderer.clear();
            
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
    
    /**
     * Cierra la sesión del usuario
     */
    async logout() {
        const success = await AuthService.logout();
        if (success) {
            window.location.href = '/login';
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    const app = new TwilioMonitorApp();
    app.init();
    
    // Exponer funciones globales para los event handlers en HTML
    window.buscar = () => app.search();
    window.limpiarFiltros = () => app.clearFilters();
    window.exportarCSV = () => app.exportCSV();
    window.cerrarSesion = () => app.logout();
});