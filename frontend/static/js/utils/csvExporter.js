/**
 * Utilidad para exportar datos a CSV
 */
import DateFormatter from './dateFormatter.js';

class CSVExporter {
    /**
     * Exporta la tabla actual a CSV
     * @param {string} tableId - ID de la tabla
     */
    static exportTable(tableId) {
        const table = document.getElementById(tableId);
        const rows = table.getElementsByTagName("tr");
        
        if (rows.length === 0) {
            alert("No hay datos para exportar");
            return;
        }
        
        // Encabezados del CSV
        let csv = "Fecha,Hora,From,To,Body,Status\n";
        
        for (let row of rows) {
            const cells = row.getElementsByTagName("td");
            
            if (cells.length === 5) {
                const fecha = cells[0].querySelector(".date-main")?.textContent || "";
                const hora = cells[0].querySelector(".date-time")?.textContent || "";
                const from = cells[1].textContent.trim();
                const to = cells[2].textContent.trim();
                
                // Limpiar el body del mensaje
                let body = cells[3].textContent.trim();
                
                // Reemplazar saltos de línea con espacios
                body = body.replace(/\r\n/g, ' ');  // Windows
                body = body.replace(/\n/g, ' ');    // Unix/Mac
                body = body.replace(/\r/g, ' ');    // Mac antiguo
                
                // Reemplazar múltiples espacios con uno solo
                body = body.replace(/\s+/g, ' ');
                
                // Escapar comillas dobles
                body = body.replace(/"/g, '""');
                
                const status = cells[4].textContent.trim();
                
                csv += `"${fecha}","${hora}","${from}","${to}","${body}","${status}"\n`;
            }
        }
        
        this._downloadCSV(csv);
    }
    
    /**
     * Descarga el CSV con codificación UTF-8 BOM
     * @param {string} csvContent - Contenido del CSV
     */
    static _downloadCSV(csvContent) {
        // Agregar BOM (Byte Order Mark) para UTF-8
        // Esto hace que Excel reconozca automáticamente la codificación UTF-8
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        
        // Crear Blob con codificación UTF-8 explícita
        const blob = new Blob([csvWithBOM], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `twilio_mensajes_${DateFormatter.getCurrentDateISO()}.csv`;
        
        // Para compatibilidad con navegadores antiguos
        link.style.display = 'none';
        document.body.appendChild(link);
        
        link.click();
        
        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

export default CSVExporter;
