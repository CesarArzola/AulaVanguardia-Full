/**
 * Auth.js - Servicio de Autenticación y Control de Acceso (RBAC)
 * Centraliza la lógica de sesión simulada en LocalStorage y protección de rutas.
 */

export class Auth {
    static SESSION_KEY = 'safeSchool_session';

    /**
     * Inicia la sesión guardando los datos del usuario y un token simulado.
     * @param {string} email - Correo del usuario
     * @param {string} role - Rol asignado (Administrador, Inspector, Docente, Visitante)
     * @returns {Object} Datos de la sesión creada
     */
    static login(email, role) {
        const sessionData = {
            userEmail: email,
            userRole: role,
            token: `simulated_jwt_token_${Date.now()}`,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        return sessionData;
    }

    /**
     * Cierra la sesión activa y redirige al usuario al Login.
     */
    static logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'index.html';
    }

    /**
     * Obtiene el objeto del usuario actualmente autenticado.
     * @returns {Object|null}
     */
    static getCurrentUser() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }

    /**
     * Guardián de Ruta: Verifica si hay una sesión activa.
     * Si no hay sesión, redirige automáticamente a index.html.
     * @returns {Object|null} Usuario autenticado
     */
    static requireAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }
        return user;
    }

    /**
     * Comprueba si el usuario actual posee un rol determinado para restringir funciones.
     * @param {Array<string>} allowedRoles - Lista de roles permitidos (ej: ['Administrador', 'Inspector'])
     * @returns {boolean}
     */
    static hasRole(allowedRoles = []) {
        const user = this.getCurrentUser();
        if (!user) return false;
        return allowedRoles.includes(user.userRole);
    }
}