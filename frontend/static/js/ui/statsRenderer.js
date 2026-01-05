/**
 * Renderizador de estadísticas de mensajes
 */
class StatsRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }
    
    /**
     * Renderiza las estadísticas de la búsqueda actual
     * @param {Object} data - Datos de la respuesta con estadísticas
     */
    render(data) {
        if (!data || data.total === 0) {
            this.container.innerHTML = '';
            return;
        }
        
        const start = (data.page - 1) * data.per_page + 1;
        const end = Math.min(start + data.mensajes.length - 1, data.total);
        
        this.container.innerHTML = `
            <div class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-chat-dots"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Total Mensajes</div>
                            <div class="stat-value">${data.total}</div>
                        </div>
                    </div>
                </div>
                
                <div class="col-6 col-md-3">
                    <div class="stat-card stat-card-highlight">
                        <div class="stat-icon stat-icon-highlight">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Usuarios Únicos</div>
                            <div class="stat-value">${data.unique_users || 0}</div>
                        </div>
                    </div>
                </div>
                
                <div class="col-6 col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-file-text"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Página Actual</div>
                            <div class="stat-value">${data.page} / ${data.total_pages}</div>
                        </div>
                    </div>
                </div>
                
                <div class="col-6 col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-eye"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Mostrando</div>
                            <div class="stat-value">${start}-${end}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center mb-2">
                <small class="text-muted">
                    <i class="bi bi-info-circle"></i>
                    Los usuarios únicos excluyen el número del servicio seleccionado
                    ${data.has_more ? ' (puede haber más resultados)' : ''}
                </small>
            </div>
        `;
    }
    
    /**
     * Limpia el contenedor de estadísticas
     */
    clear() {
        this.container.innerHTML = '';
    }
}

export default StatsRenderer;