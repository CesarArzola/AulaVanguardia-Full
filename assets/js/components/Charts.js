/**
 * Controlador de Gráficos e Inteligencia de Datos (Chart.js)
 */
export class IncidentCharts {
    constructor() {
        this.chartMes = null;
        this.chartZona = null;
    }

    /**
     * Inicializa ambos gráficos leyendo la data por defecto
     * @param {Object} data - Objeto data con arreglos para los gráficos
     */
    init(data) {
        this.renderIncidentesMes(data.incidentesPorMes);
        this.renderAlarmasZona(data.alarmasPorZona);
    }

    renderIncidentesMes(dataMes) {
        const ctx = document.getElementById('chart-incidentes-mes')?.getContext('2d');
        if (!ctx) return;

        this.chartMes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataMes.labels,
                datasets: [
                    {
                        label: 'Incidentes',
                        data: dataMes.incidentes,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Alarmas',
                        data: dataMes.alarmas,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    renderAlarmasZona(dataZona) {
        const ctx = document.getElementById('chart-alarmas-zona')?.getContext('2d');
        if (!ctx) return;

        this.chartZona = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dataZona.labels,
                datasets: [{
                    data: dataZona.porcentajes,
                    backgroundColor: dataZona.colores,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}