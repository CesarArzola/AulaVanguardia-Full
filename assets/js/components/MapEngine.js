/**
 * Motor de Renderizado e Interacción del Plano SVG del Establecimiento
 */
import { EventBus } from '../core/EventBus.js';

export class MapEngine {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        this.zoomLevel = 1;
        this.isPan = false;
        this.startCoords = { x: 0, y: 0 };
        this.viewBox = { x: 0, y: 0, width: 800, height: 500 };
        this.salas = [];

        this.initControls();
    }

    /**
     * Carga y renderiza el mapa SVG desde un arreglo de salas
     * @param {Array} salasData - Datos cargados desde salas.json
     */
    render(salasData) {
        this.salas = salasData;
        this.svg.innerHTML = ''; // Limpiar contenedor SVG

        // Renderizar cada sala
        salasData.forEach(sala => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('id', `group-${sala.id}`);

            // Rectángulo de la sala
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', sala.id);
            rect.setAttribute('x', sala.x);
            rect.setAttribute('y', sala.y);
            rect.setAttribute('width', sala.ancho);
            rect.setAttribute('height', sala.alto);
            rect.setAttribute('rx', '6'); // Bordes redondeados
            rect.setAttribute('fill', sala.color);
            rect.setAttribute('stroke', '#cbd5e1');
            rect.setAttribute('stroke-width', '2');

            // Determinar estado de animación inicial
            if (sala.estado === 'alarma') {
                rect.setAttribute('class', 'room-shape room-alarm');
            } else if (sala.estado === 'advertencia') {
                rect.setAttribute('class', 'room-shape room-warning');
            } else {
                rect.setAttribute('class', 'room-shape');
            }

            // Etiqueta de Texto con el nombre de la sala
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', sala.x + (sala.ancho / 2));
            text.setAttribute('y', sala.y + (sala.alto / 2));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('class', 'room-label');
            text.textContent = sala.nombre;

            // Evento Click en la sala -> Disparar Modal de Información
            group.addEventListener('click', () => {
                EventBus.publish('ROOM_SELECTED', sala);
            });

            group.appendChild(rect);
            group.appendChild(text);
            this.svg.appendChild(group);
        });
    }

    /**
     * Inicializa los controles de Zoom y Pan (Arrastrar el mapa)
     */
    initControls() {
        const container = document.getElementById('map-container');

        // Zoom con botones
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.zoom(0.8));
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.zoom(1.2));
        document.getElementById('btn-reset-map')?.addEventListener('click', () => this.resetMap());

        // Desplazamiento (Pan) con Mouse Drag
        container?.addEventListener('mousedown', (e) => {
            this.isPan = true;
            this.startCoords = { x: e.clientX, y: e.clientY };
        });

        container?.addEventListener('mousemove', (e) => {
            if (!this.isPan) return;
            const dx = (e.clientX - this.startCoords.x) * (this.viewBox.width / container.clientWidth);
            const dy = (e.clientY - this.startCoords.y) * (this.viewBox.height / container.clientHeight);

            this.viewBox.x -= dx;
            this.viewBox.y -= dy;
            this.updateViewBox();
            this.startCoords = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => this.isPan = false);
    }

    zoom(factor) {
        this.viewBox.width *= factor;
        this.viewBox.height *= factor;
        this.updateViewBox();
    }

    resetMap() {
        this.viewBox = { x: 0, y: 0, width: 800, height: 500 };
        this.updateViewBox();
    }

    updateViewBox() {
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    }

    /**
     * Cambia el estado visual de una sala a ALARMA (rojo parpadeante)
     */
    triggerAlarm(roomId) {
        const roomElement = document.getElementById(roomId);
        if (roomElement) {
            roomElement.setAttribute('class', 'room-shape room-alarm');
        }
    }
}