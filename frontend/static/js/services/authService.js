/**
 * Servicio de autenticación
 */
class AuthService {
    /**
     * Verifica si el usuario está autenticado
     * @returns {Promise<Object>} Estado de autenticación
     */
    static async checkAuth() {
        try {
            const response = await fetch('/api/check-auth');
            return await response.json();
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            return { authenticated: false };
        }
    }
    
    /**
     * Cierra la sesión del usuario
     * @returns {Promise<boolean>} True si se cerró exitosamente
     */
    static async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            return false;
        }
    }
}

export default AuthService;
