/**
 * Utilidad para exportar datos a CSV
 */
import DateFormatter from './dateFormatter.js';

class CSVExporter {
    /**
     * Exporta la tabla actual a CSV
     */
    static exportTable(tableId) {
        const table = document.getElementById(tableId);
        const rows = table.getElementsByTagName("tr");
        
        if (rows.length === 0) {
            alert("No hay datos para exportar");
            return;
        }
        
        let csv = "Fecha,Hora,From,To,Body,Status\n";
        
        for (let row of rows) {
            const cells = row.getElementsByTagName("td");
            
            if (cells.length === 5) {
                const fecha = cells[0].querySelector(".date-main")?.textContent || "";
                const hora = cells[0].querySelector(".date-time")?.textContent || "";
                const from = cells[1].textContent.trim();
                const to = cells[2].textContent.trim();
                const body = cells[3].textContent.trim().replace(/"/g, '""');
                const status = cells[4].textContent.trim();
                
                csv += `"${fecha}","${hora}","${from}","${to}","${body}","${status}"\n`;
            }
        }
        
        this._downloadCSV(csv);
    }
    
    /**
     * Descarga el CSV
     */
    static _downloadCSV(csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `twilio_mensajes_${DateFormatter.getCurrentDateISO()}.csv`;
        link.click();
        
        window.URL.revokeObjectURL(url);
    }
}

export default CSVExporter;
