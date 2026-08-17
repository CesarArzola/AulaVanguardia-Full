/**
 * DataFetch.js - Servicio para Peticiones HTTP y Gestión de Datos Simulados
 */
import { Storage } from './Storage.js';

export class DataFetch {
    /**
     * Obtiene los datos de las salas.
     * Si ya existen modificaciones en LocalStorage las retorna; de lo contrario, lee salas.json.
     */
    static async getSalas() {
        const localRooms = Storage.get(Storage.KEYS.ROOMS);
        if (localRooms && localRooms.length > 0) {
            return localRooms;
        }

        try {
            const response = await fetch('assets/data/salas.json');
            if (!response.ok) throw new Error('No se pudo cargar salas.json');

            const salas = await response.json();
            Storage.set(Storage.KEYS.ROOMS, salas); // Cachear localmente
            return salas;
        } catch (error) {
            console.error('Error en DataFetch.getSalas:', error);
            return [];
        }
    }

    /**
     * Obtiene los datos semilla iniciales (usuarios, gráficos y estadísticas)
     */
    static async getDefaultData() {
        try {
            const response = await fetch('assets/data/default_data.json');
            if (!response.ok) throw new Error('No se pudo cargar default_data.json');

            return await response.json();
        } catch (error) {
            console.error('Error en DataFetch.getDefaultData:', error);
            return null;
        }
    }

    /**
     * Simula el registro de una emergencia en el servidor (o LocalStorage)
     * @param {Object} panicData 
     */
    static async registerPanicEvent(panicData) {
        // Guardar localmente usando el servicio de Storage
        Storage.saveIncident(panicData);

        // Actualizar el estado de la sala en la lista cacheada
        const salas = await this.getSalas();
        const salaIndex = salas.findIndex(s => s.id === panicData.roomId);

        if (salaIndex !== -1) {
            salas[salaIndex].estado = 'alarma';
            Storage.set(Storage.KEYS.ROOMS, salas);
        }

        return { success: true, timestamp: new Date().toISOString() };
    }
}