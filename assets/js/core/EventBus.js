/**
 * EventBus - Patrón Pub/Sub (Publicador/Suscriptor)
 * Permite que los componentes se comuniquen entre sí sin depender directamente unos de otros.
 */
export const EventBus = {
    events: {},

    /**
     * Suscribirse a un evento
     * @param {string} eventName - Nombre del evento (ej: 'PANIC_TRIGGERED')
     * @param {Function} callback - Función que se ejecuta al disparar el evento
     */
    subscribe(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    },

    /**
     * Publicar / Disparar un evento
     * @param {string} eventName - Nombre del evento
     * @param {Object} data - Datos asociados al evento
     */
    publish(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }
};