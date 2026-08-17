import { EventBus } from '../core/EventBus.js';
import { Auth } from '../core/Auth.js';

export class PanicBtn {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        // 1. Botón de Alerta General
        const btnAlerta = document.getElementById('btn-alerta-general');
        if (btnAlerta) {
            btnAlerta.addEventListener('click', () => this.confirmGeneralEmergency());
        }

        // 2. NUEVO: Botón de Simulación de Huella
        const btnHuella = document.getElementById('btn-simular-huella');
        if (btnHuella) {
            btnHuella.addEventListener('click', () => this.simularLecturaHuella());
        }

        // 3. Escuchar clic en salas del mapa
        EventBus.subscribe('ROOM_SELECTED', (sala) => {
            this.showRoomModal(sala);
        });

        // 4. NUEVO: Escuchar evento desde el hardware físico (Arduino/USB)
        EventBus.subscribe('HARDWARE_PANIC_TRIGGERED', (datos) => {
            this.triggerEmergency(datos.roomId, datos.roomName, datos.tipo);
        });
    }

    async simularLecturaHuella() {
        const usuarioActual = Auth.getCurrentUser();
        const identificador = usuarioActual ? usuarioActual.userEmail : 'Inspector';
        const rol = usuarioActual ? usuarioActual.userRole : 'Personal Autorizado';

        // 1. Verificamos si el navegador y el dispositivo soportan biometría nativa
        if (!window.PublicKeyCredential) {
            Swal.fire('No Soportado', 'Su dispositivo o navegador no soporta biometría web (WebAuthn).', 'error');
            return;
        }

        try {
            // 2. Configuramos la petición al sistema operativo (Mac/Windows/Android)
            // Nota: Para un prototipo frontend, simulamos el "challenge" (desafío)
            const opcionesBiometria = {
                challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), // Dato aleatorio simulado
                rp: {
                    name: "SAFE SCHOOL" // Nombre de tu aplicación
                },
                user: {
                    id: new Uint8Array([1, 2, 3, 4]),
                    name: identificador,
                    displayName: rol
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: {
                    // "platform" obliga a usar el TouchID (Mac) o Windows Hello, ignorando USBs externos
                    authenticatorAttachment: "platform",
                    userVerification: "required" // Exige que se verifique la identidad
                },
                timeout: 60000,
                attestation: "none"
            };

            // 3. ¡AQUÍ ES DONDE SE ACTIVA EL HARDWARE REAL DEL EQUIPO!
            // Esto abrirá la ventana nativa de TouchID o Windows Hello
            const credencial = await navigator.credentials.create({
                publicKey: opcionesBiometria
            });

            // 4. Si el código llega aquí, la huella fue validada correctamente por el Mac/PC
            if (credencial) {
                Swal.fire({
                    icon: 'success',
                    title: 'Identidad Confirmada',
                    html: `<b>Biometría Nativa:</b> ${identificador} <br> <b>Cargo:</b> ${rol}`,
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    // Disparamos la emergencia
                    this.triggerEmergency(
                        'biometrico-nativo',
                        'Acceso Biométrico',
                        `Alerta Crítica (Autorizada por: ${rol})`
                    );
                });
            }

        } catch (error) {
            // Si el usuario cancela la ventana de huella o falla la lectura
            console.error("Error biométrico:", error);

            if (error.name === 'NotAllowedError') {
                Swal.fire('Cancelado', 'La lectura biométrica fue cancelada por el usuario.', 'warning');
            } else {
                Swal.fire('Error', 'No se pudo activar el lector del dispositivo. ¿Está configurado el TouchID/Windows Hello?', 'error');
            }
        }
    }

    // --- MANTÉN AQUÍ TUS OTROS MÉTODOS ---
    // confirmGeneralEmergency()
    // showRoomModal(sala)
    // triggerEmergency(roomId, roomName, tipoIncidente)
    // addIncidentToFeed(incidente)
}