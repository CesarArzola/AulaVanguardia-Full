/**
 * HardwareConnector.js
 * Módulo para leer dispositivos físicos vía puerto serial USB.
 * INCLUYE LÓGICA DE ROLES Y SIMULACIÓN PARA PRUEBAS.
 */
import { EventBus } from '../core/EventBus.js';

export class HardwareConnector {
    constructor() {
        this.port = null;
        this.reader = null;
        this.isSimulating = false; // Bandera para saber si usamos hardware real o simulación
        this.initListeners();
    }

    initListeners() {
        const btnConnect = document.getElementById('btn-conectar-hardware');
        if (btnConnect) {
            btnConnect.addEventListener('click', () => this.connectSerial());
        }
    }

    async connectSerial() {
        if (!('serial' in navigator)) {
            // Si el navegador no soporta Web Serial (o no hay Arduino), entramos en modo simulación
            this.activarModoSimulacion();
            return;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            
            this.actualizarInterfazConexion('Sensor Serial Conectado');
            this.readLoop();

        } catch (error) {
            console.warn('Conexión serial fallida o cancelada. Iniciando emulador de hardware para pruebas.');
            // Si el usuario cancela la ventana de selección de puerto, activamos el simulador
            this.activarModoSimulacion();
        }
    }

    activarModoSimulacion() {
        this.isSimulating = true;
        this.actualizarInterfazConexion('Hardware Emulado (Modo Prueba)');
        
        Swal.fire({
            title: 'Modo Desarrollo Activado',
            text: 'Como no se detectó un puerto COM válido (Arduino/ESP32), se activó el emulador de hardware. Use las teclas 1, 2 o 3 para simular lecturas del huellero.',
            icon: 'info'
        });

        // Escuchamos el teclado para simular que el hardware envía datos por USB
        document.addEventListener('keydown', (e) => {
            if (!this.isSimulating) return;
            
            if (e.key === '1') this.processHardwareData('ID:100|ROLE:ADMIN');
            if (e.key === '2') this.processHardwareData('ID:205|ROLE:DOCENTE');
            if (e.key === '3') this.processHardwareData('ID:999|ROLE:DESCONOCIDO');
        });
    }

    actualizarInterfazConexion(mensaje) {
        const btnConnect = document.getElementById('btn-conectar-hardware');
        btnConnect.classList.replace('btn-outline-secondary', 'btn-success');
        btnConnect.innerHTML = `<i class="bi bi-usb-plug-fill fs-5"></i> <span class="d-none d-xxl-inline fw-semibold">${mensaje}</span>`;
    }

    async readLoop() {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
        this.reader = textDecoder.readable.getReader();
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) break;
                if (value) {
                    buffer += value;
                    if (buffer.includes('\n')) {
                        const data = buffer.trim();
                        buffer = ''; 
                        this.processHardwareData(data);
                    }
                }
            }
        } catch (error) {
            console.error('Error leyendo el puerto serial:', error);
        }
    }

    /**
     * Esta es la lógica de negocio que tus estudiantes deben analizar.
     * Analiza el "texto" que llega desde el dispositivo USB.
     */
    processHardwareData(data) {
        console.log("Datos crudos del hardware:", data);

        // Simulamos que el hardware envía un string con el formato: "ID:xxx|ROLE:yyy"
        if (data.includes('ROLE:ADMIN')) {
            EventBus.publish('HARDWARE_PANIC_TRIGGERED', {
                roomId: 'acceso-principal', 
                roomName: 'Punto Biométrico',
                tipo: 'ALERTA CRÍTICA: Activada por Inspector/Directivo'
            });
            
            // Retroalimentación visual inmediata
            Swal.fire('Autorizado', 'Huella de Administrador reconocida. Activando protocolos mayores.', 'error');
            
        } else if (data.includes('ROLE:DOCENTE')) {
            EventBus.publish('HARDWARE_PANIC_TRIGGERED', {
                roomId: 'acceso-principal', 
                roomName: 'Punto Biométrico',
                tipo: 'Advertencia: Activada por Docente'
            });
            
            Swal.fire('Autorizado', 'Huella de Docente reconocida. Registrando advertencia en bitácora.', 'warning');
            
        } else {
            // Si el hardware lee una huella que no está en la base de datos
            Swal.fire({
                title: 'Acceso Denegado',
                text: 'La huella leída por el sensor físico no tiene privilegios para activar alertas.',
                icon: 'error',
                timer: 3000
            });
        }
    }
}