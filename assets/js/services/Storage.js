/**
 * Storage.js - Servicio para Gestión de Persistencia Local (LocalStorage)
 */
export class Storage {
    static KEYS = {
        INCIDENTS: 'safeSchool_incidents',
        SETTINGS: 'safeSchool_settings',
        ROOMS: 'safeSchool_rooms',
        USERS: 'safeSchool_users'
    };

    /**
     * Obtiene un elemento parseado desde LocalStorage
     * @param {string} key - Clave del elemento
     * @param {*} defaultValue - Valor por defecto en caso de no existir
     */
    static get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error al leer la clave "${key}" desde LocalStorage:`, error);
            return defaultValue;
        }
    }

    /**
     * Guarda un elemento serializado en LocalStorage
     * @param {string} key - Clave del elemento
     * @param {*} value - Objeto o dato a guardar
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error al guardar en LocalStorage [Clave: "${key}"]:`, error);
            return false;
        }
    }

    /**
     * Elimina una clave de LocalStorage
     */
    static remove(key) {
        localStorage.removeItem(key);
    }

    // --- MÉTODOS ESPECÍFICOS DEL DOMINIO ---

    /**
     * Guarda un nuevo incidente en el historial local
     * @param {Object} incident - Datos del incidente
     */
    static saveIncident(incident) {
        const history = this.get(this.KEYS.INCIDENTS, []);
        history.unshift(incident); // Agregar al inicio del arreglo
        this.set(this.KEYS.INCIDENTS, history);
        return history;
    }

    /**
     * Obtiene todo el historial de incidentes acumulados
     */
    static getIncidents() {
        return this.get(this.KEYS.INCIDENTS, []);
    }

    /**
     * Actualiza la configuración global de la app (ej: Sonido, Modo Oscuro)
     * @param {Object} newSettings 
     */
    static updateSettings(newSettings) {
        const current = this.get(this.KEYS.SETTINGS, {});
        const updated = { ...current, ...newSettings };
        this.set(this.KEYS.SETTINGS, updated);
        return updated;
    }
}