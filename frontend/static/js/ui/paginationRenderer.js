/**
 * Renderizador de paginación
 */
class PaginationRenderer {
    constructor(paginationId, infoId, onPageChange) {
        this.pagination = document.getElementById(paginationId);
        this.info = document.getElementById(infoId);
        this.onPageChange = onPageChange;
    }
    
    /**
     * Renderiza el paginador
     * @param {number} currentPage - Página actual
     * @param {number} totalPages - Total de páginas
     * @param {boolean} hasMore - Si hay más páginas
     */
    render(currentPage, totalPages, hasMore) {
        this.pagination.innerHTML = "";
        
        if (totalPages <= 1 && !hasMore) {
            return;
        }
        
        // Botón anterior
        this._renderPreviousButton(currentPage);
        
        // Números de página
        this._renderPageNumbers(currentPage, totalPages, hasMore);
        
        // Botón siguiente
        this._renderNextButton(currentPage, totalPages, hasMore);
    }
    
    /**
     * Renderiza información de resultados
     * @param {Object} data - Datos de la respuesta
     */
    renderInfo(data) {
        if (data.total === 0) {
            this.info.innerHTML = '';
            return;
        }
        
        const start = (data.page - 1) * data.per_page + 1;
        const end = Math.min(start + data.mensajes.length - 1, data.total);
        
        this.info.innerHTML = `
            <small class="text-muted">
                Mostrando ${start}-${end} de ${data.total} mensajes
                ${data.has_more ? ' (aprox.)' : ''}
            </small>
        `;
    }
    
    /**
     * Renderiza el botón anterior
     * @param {number} currentPage - Página actual
     */
    _renderPreviousButton(currentPage) {
        const li = document.createElement("li");
        li.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        
        const link = document.createElement("a");
        link.className = "page-link";
        link.href = "#";
        link.textContent = "Anterior";
        link.onclick = (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                this.onPageChange(currentPage - 1);
            }
        };
        
        li.appendChild(link);
        this.pagination.appendChild(li);
    }
    
    /**
     * Renderiza el botón siguiente
     * @param {number} currentPage - Página actual
     * @param {number} totalPages - Total de páginas
     * @param {boolean} hasMore - Si hay más páginas
     */
    _renderNextButton(currentPage, totalPages, hasMore) {
        const isDisabled = !hasMore && currentPage >= totalPages;
        
        const li = document.createElement("li");
        li.className = `page-item ${isDisabled ? 'disabled' : ''}`;
        
        const link = document.createElement("a");
        link.className = "page-link";
        link.href = "#";
        link.textContent = "Siguiente";
        link.onclick = (e) => {
            e.preventDefault();
            if (!isDisabled) {
                this.onPageChange(currentPage + 1);
            }
        };
        
        li.appendChild(link);
        this.pagination.appendChild(li);
    }
    
    /**
     * Renderiza los números de página
     * @param {number} currentPage - Página actual
     * @param {number} totalPages - Total de páginas
     * @param {boolean} hasMore - Si hay más páginas
     */
    _renderPageNumbers(currentPage, totalPages, hasMore) {
        const range = 2;
        const start = Math.max(1, currentPage - range);
        const end = Math.min(totalPages, currentPage + range);
        
        // Primera página si no está en el rango
        if (start > 1) {
            this._renderPageButton(1, currentPage);
            
            if (start > 2) {
                this._renderEllipsis();
            }
        }
        
        // Páginas del rango
        for (let i = start; i <= end; i++) {
            this._renderPageButton(i, currentPage);
        }
        
        // Última página si no está en el rango
        if (end < totalPages || hasMore) {
            if (end < totalPages - 1) {
                this._renderEllipsis();
            }
            
            if (!hasMore && end < totalPages) {
                this._renderPageButton(totalPages, currentPage);
            }
        }
    }
    
    /**
     * Renderiza un botón de página
     * @param {number} pageNumber - Número de página
     * @param {number} currentPage - Página actual
     */
    _renderPageButton(pageNumber, currentPage) {
        const li = document.createElement("li");
        li.className = `page-item ${pageNumber === currentPage ? 'active' : ''}`;
        
        const link = document.createElement("a");
        link.className = "page-link";
        link.href = "#";
        link.textContent = pageNumber;
        link.onclick = (e) => {
            e.preventDefault();
            this.onPageChange(pageNumber);
        };
        
        li.appendChild(link);
        this.pagination.appendChild(li);
    }
    
    /**
     * Renderiza puntos suspensivos
     */
    _renderEllipsis() {
        const li = document.createElement("li");
        li.className = "page-item disabled";
        
        const span = document.createElement("span");
        span.className = "page-link";
        span.textContent = "...";
        
        li.appendChild(span);
        this.pagination.appendChild(li);
    }
}

export default PaginationRenderer;
