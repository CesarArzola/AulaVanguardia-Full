/**
 * Lógica Central de AulaVanguardia
 * Gestión de Autenticación, Roles, Permisos y Navegación Dinámica
 */

const app = {
    usuarioActual: null,
    mapa: null,
    alertasContador: 0,

    // Definición de matriz de permisos por rol
    permisos: {
        'alumno': {
            nombre: 'Alumno',
            permitidas: ['vista-estudiante']
        },
        'apoderado': {
            nombre: 'Apoderado',
            permitidas: ['vista-apoderado']
        },
        'profesor-docente': {
            nombre: 'Profesor-Docente',
            permitidas: ['vista-inspector']
        },
        'director': {
            nombre: 'Director',
            permitidas: ['vista-estudiante', 'vista-apoderado', 'vista-inspector']
        }
    },

    // Iniciar Sesión con comprobación de Rol
    iniciarSesion(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rol = document.getElementById('login-rol').value;

        if (!email || !password || !rol) {
            Swal.fire('Atención', 'Por favor complete todos los campos.', 'warning');
            return;
        }

        this.usuarioActual = { email, rol };

        const nombreRol = this.permisos[rol].nombre;

        Swal.fire({
            icon: 'success',
            title: '¡Sesión Iniciada!',
            text: `Bienvenido a AulaVanguardia (${nombreRol})`,
            timer: 1600,
            showConfirmButton: false
        });

        // Determinar vista inicial
        if (rol === 'alumno') {
            this.navegarVista('vista-estudiante');
        } else if (rol === 'apoderado') {
            this.navegarVista('vista-apoderado');
        } else if (rol === 'profesor-docente') {
            this.navegarVista('vista-inspector');
        } else if (rol === 'director') {
            this.navegarVista('vista-inspector');
        }
    },

    // Navegación con restricción de acceso
    navegarVista(idVista) {
        if (!this.usuarioActual) {
            this.mostrarVista('vista-login');
            return;
        }

        const rol = this.usuarioActual.rol;
        const vistasPermitidas = this.permisos[rol].permitidas;

        // Validar si el rol tiene acceso a la pantalla solicitada
        if (!vistasPermitidas.includes(idVista)) {
            Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: `El rol "${this.permisos[rol].nombre}" no tiene permisos para ingresar a esta sección.`,
                confirmButtonColor: '#dc3545'
            });
            return;
        }

        // Mostrar u ocultar barra del Director
        const directorNav = document.getElementById('director-nav');
        if (directorNav) {
            if (rol === 'director') {
                directorNav.classList.remove('d-none');
            } else {
                directorNav.classList.add('d-none');
            }
        }

        this.mostrarVista(idVista);

        // Si se entra a la sala de control, inicializar mapa Leaflet
        if (idVista === 'vista-inspector') {
            setTimeout(() => this.initMapa(), 200);
        }
    },

    // Cambio de visibilidad en el DOM
    mostrarVista(idVista) {
        const vistas = ['vista-login', 'vista-estudiante', 'vista-apoderado', 'vista-inspector'];
        vistas.forEach(v => {
            const el = document.getElementById(v);
            if (el) {
                if (v === idVista) {
                    el.classList.remove('oculto');
                } else {
                    el.classList.add('oculto');
                }
            }
        });
    },

    // Cerrar sesión y volver al login
    cerrarSesion() {
        this.usuarioActual = null;
        
        const formLogin = document.getElementById('form-login');
        if (formLogin) formLogin.reset();

        const directorNav = document.getElementById('director-nav');
        if (directorNav) directorNav.classList.add('d-none');

        this.mostrarVista('vista-login');

        Swal.fire({
            icon: 'info',
            title: 'Sesión Cerrada',
            text: 'Ha cerrado sesión correctamente. Seleccione un rol para continuar.',
            timer: 1500,
            showConfirmButton: false
        });
    },

    // Inicializar Mapa GPS
    initMapa() {
        const contenedorMapa = document.getElementById('mapa-liceo');
        if (contenedorMapa && !this.mapa && window.L) {
            this.mapa = L.map('mapa-liceo').setView([-33.4489, -70.6693], 17);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© AulaVanguardia'
            }).addTo(this.mapa);

            L.marker([-33.4489, -70.6693]).addTo(this.mapa)
                .bindPopup('<b>AulaVanguardia</b><br>Zona Central Monitoreada.')
                .openPopup();
        } else if (this.mapa) {
            this.mapa.invalidateSize();
        }
    },

    // Funciones operativas de alertas y reportes
    enviarAlertaSOS(tipo) {
        this.alertasContador++;
        const statAlarmas = document.getElementById('stat-alarmas');
        if (statAlarmas) statAlarmas.textContent = this.alertasContador;

        const feedAlertas = document.getElementById('feed-alertas');
        const sinAlertas = document.getElementById('sin-alertas');
        if (sinAlertas) sinAlertas.classList.add('d-none');

        if (feedAlertas) {
            const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const item = document.createElement('div');
            item.className = 'card p-3 border-start border-4 border-danger shadow-sm bg-white animate__animated animate__fadeInDown';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge bg-danger">${tipo}</span>
                    <small class="text-muted">${hora}</small>
                </div>
                <strong class="text-dark">Estudiante Anónimo</strong>
                <small class="text-muted"><i class="bi bi-geo-alt-fill text-danger"></i> Ubicación GPS recibida</small>
            `;
            feedAlertas.prepend(item);
        }

        Swal.fire({
            icon: 'warning',
            title: 'S.O.S Enviado',
            text: `Reporte de "${tipo}" emitido a la Sala de Control.`,
            confirmButtonColor: '#dc3545'
        });
    },

    limpiarAlertasMapa() {
        this.alertasContador = 0;
        const statAlarmas = document.getElementById('stat-alarmas');
        if (statAlarmas) statAlarmas.textContent = '0';

        const feedAlertas = document.getElementById('feed-alertas');
        if (feedAlertas) {
            feedAlertas.innerHTML = `
                <div class="text-center text-muted p-4 my-auto bg-light rounded-4 border border-dashed" id="sin-alertas">
                    <i class="bi bi-shield-check fs-1 text-success opacity-50 mb-3 d-block"></i>
                    <p class="mb-0 fw-medium">Sin incidentes recientes.</p>
                    <small class="text-muted">El establecimiento se encuentra seguro.</small>
                </div>
            `;
        }

        Swal.fire('Sistema Restablecido', 'Se ha restablecido el estado normal del colegio.', 'success');
    },

    enviarAlertaGeneral() {
        Swal.fire({
            title: '¿ACTIVAR ALERTA GENERAL?',
            text: 'Se activará la alarma sonora en todo el colegio.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, Activar Alarma',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('¡ALERTA ACTIVADA!', 'Sirena general en marcha.', 'error');
            }
        });
    },

    crearComunicado() {
        Swal.fire({
            title: 'Enviar Comunicado a Apoderados',
            input: 'textarea',
            inputPlaceholder: 'Escriba el comunicado oficial...',
            showCancelButton: true,
            confirmButtonText: 'Publicar',
            cancelButtonText: 'Cancelar'
        }).then((res) => {
            if (res.isConfirmed && res.value) {
                const feed = document.getElementById('feed-comunicados');
                if (feed) {
                    const card = document.createElement('div');
                    card.className = 'card p-3 shadow-sm border-start border-4 border-success rounded-3 animate__animated animate__fadeInDown';
                    card.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-success">Oficial</span>
                            <small class="text-muted">Ahora</small>
                        </div>
                        <h5 class="fw-bold h6 text-dark mb-1">Aviso Oficial</h5>
                        <p class="text-muted small mb-0">${res.value}</p>
                    `;
                    feed.prepend(card);
                }
                Swal.fire('Publicado', 'El comunicado ha sido enviado al Portal Familia.', 'success');
            }
        });
    },

    menuInspector(opcion) {
        console.log('Navegando en menú inspector:', opcion);
    }
};

// Asignar objeto global
window.app = app;