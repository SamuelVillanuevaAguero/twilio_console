/**
 * Utilidades para formateo de fechas
 */
class DateFormatter {
    /**
     * Formatea una fecha de mensaje para mostrar
     */
    static formatMessageDate(dateString) {
        if (!dateString) {
            return {
                dateMain: "—",
                dateTime: "—"
            };
        }
        
        const [date, time] = dateString.split("T");
        
        return {
            dateMain: date,
            dateTime: time ? time.substring(0, 8) : "—"
        };
    }
    
    /**
     * Obtiene la fecha actual en formato ISO para nombres de archivo
     */
    static getCurrentDateISO() {
        return new Date().toISOString().split('T')[0];
    }
}

export default DateFormatter;
