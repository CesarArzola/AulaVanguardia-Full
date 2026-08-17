/**
 * Control del Motor de Sonido con Howler.js
 */
export class AudioManager {
    constructor() {
        // Inicialización de efectos de sonido simulados
        this.sounds = {
            alarm: new Howl({
                src: ['assets/sounds/alarm.mp3'],
                loop: true,
                volume: 0.7,
                onloaderror: () => console.warn('Archivo alarm.mp3 no encontrado. Modo silencioso activo.')
            }),
            notify: new Howl({
                src: ['assets/sounds/notify.mp3'],
                volume: 0.5,
                onloaderror: () => console.warn('Archivo notify.mp3 no encontrado.')
            })
        };
    }

    playAlarm() {
        if (!this.sounds.alarm.playing()) {
            this.sounds.alarm.play();
        }
    }

    stopAlarm() {
        this.sounds.alarm.stop();
    }

    playNotify() {
        this.sounds.notify.play();
    }
}