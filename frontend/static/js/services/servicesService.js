/**
 * Servicio para gestionar servicios de Twilio (chatbots/números)
 */
class ServicesService {
    constructor() {
        this.services = [];
        this.selectedService = null;
    }
    
    /**
     * Obtiene la lista de servicios disponibles
     * @returns {Promise<Array>} Lista de servicios
     */
    async fetchServices() {
        try {
            const response = await fetch('/api/servicios');
            const result = await response.json();
            
            if (result.success) {
                this.services = result.services;
                return this.services;
            } else {
                console.error('Error al obtener servicios:', result.message);
                return [];
            }
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            return [];
        }
    }
    
    /**
     * Establece el servicio seleccionado
     * @param {string} phoneNumber - Número de teléfono del servicio
     */
    setSelectedService(phoneNumber) {
        this.selectedService = this.services.find(
            s => s.phone_number === phoneNumber
        );
    }
    
    /**
     * Obtiene el servicio actualmente seleccionado
     * @returns {Object|null} Servicio seleccionado
     */
    getSelectedService() {
        return this.selectedService;
    }
    
    /**
     * Obtiene el índice del servicio para aplicar estilos
     * @param {string} phoneNumber - Número de teléfono del servicio
     * @returns {number} Índice del servicio
     */
    getServiceIndex(phoneNumber) {
        const index = this.services.findIndex(
            s => s.phone_number === phoneNumber
        );
        return index >= 0 ? index : 0;
    }
    
    /**
     * Verifica si un número pertenece al servicio seleccionado
     * @param {string} phoneNumber - Número a verificar
     * @returns {boolean} True si es el bot del servicio
     */
    isServiceBot(phoneNumber) {
        return this.selectedService && 
               phoneNumber === this.selectedService.phone_number;
    }
}

export default ServicesService;
