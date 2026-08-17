/**
 * alerts.js - Módulo Utilitario de Notificaciones y Alertas Visuales
 * Encapsula SweetAlert2 para mantener un estilo coherente en todo el sistema.
 */

export class Alerts {
    /**
     * Muestra una notificación rápida flotante (Toast) en la esquina superior derecha
     * @param {string} message - Mensaje a mostrar
     * @param {string} icon - 'success' | 'error' | 'warning' | 'info'
     * @param {number} timer - Tiempo en ms antes de desaparecer
     */
    static toast(message, icon = 'info', timer = 3000) {
        return Swal.fire({
            toast: true,
            position: 'top-end',
            icon: icon,
            title: message,
            showConfirmButton: false,
            timer: timer,
            timerProgressBar: true
        });
    }

    /**
     * Alerta modal informativa o de éxito
     */
    static success(title, text = '') {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: text,
            confirmButtonColor: '#0d6efd',
            confirmButtonText: 'Aceptar'
        });
    }

    /**
     * Alerta modal de error
     */
    static error(title, text = '') {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: text,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Entendido'
        });
    }

    /**
     * Diálogo de confirmación para acciones delicadas (retorna una Promesa)
     * @param {string} title 
     * @param {string} text 
     * @param {string} confirmBtnText 
     */
    static async confirm(title, text, confirmBtnText = 'Sí, continuar') {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: confirmBtnText,
            cancelButtonText: 'Cancelar'
        });

        return result.isConfirmed;
    }

    /**
     * Modal crítico de Pánico en Pantalla Completa para emergencias
     * @param {string} roomName - Nombre del lugar donde ocurrió el pánico
     * @param {string} alertType - Tipo de incidente
     */
    static panicModal(roomName, alertType = 'Emergencia Activada') {
        return Swal.fire({
            title: '🚨 ¡ALERTA CRÍTICA DE PÁNICO!',
            html: `
                <div class="text-center my-2">
                    <p class="fs-5 fw-bold text-danger mb-1">${alertType.toUpperCase()}</p>
                    <p class="fs-6 mb-3">Lugar: <strong>${roomName}</strong></p>
                    <div class="p-3 bg-danger bg-opacity-10 border border-danger rounded-3">
                        <small class="text-danger d-block fw-semibold">
                            <i class="bi bi-broadcast me-1"></i> Notificando a inspectores generales y equipo de seguridad...
                        </small>
                    </div>
                </div>
            `,
            icon: 'error',
            confirmButtonText: '<i class="bi bi-shield-check"></i> Atender Emergencia',
            confirmButtonColor: '#dc3545',
            allowOutsideClick: false,
            allowEscapeKey: false
        });
    }
}