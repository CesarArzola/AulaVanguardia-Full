/**
 * SAFE SCHOOL - Orquestador SIG (Prototipo SoSafe Escolar)
 * Arquitectura Fullstack: Geoman, Alertas GPS, Identidad Oculta (Doble Capa) y Portal Apoderados.
 */

window.app = {
    mapa: null,
    capaAlertas: null,
    capaZonas: null,    
    capaPuntos: null,
    isDraggingAlert: false,  
    coordenadasLiceo: [-33.5372, -70.6362],

    // Simulación del alumno que inició sesión en su celular
    // En producción, esto vendría del Token JWT o la base de datos de matrículas
    usuarioActual: {
        nombre: "Dany Hernandez",
        curso: "4° Medio C - Programación",
        matricula: "18.123.456-7"
    },

    // ==========================================
    // 0. INYECTOR DE ESTILOS
    // ==========================================
    inyectarEstilos: function() {
        if (document.getElementById('estilos-safeschool')) return;
        const style = document.createElement('style');
        style.id = 'estilos-safeschool';
        style.innerHTML = `
            .marcador-epicentro { width: 30px; height: 30px; background: rgba(220, 53, 69, 0.8); border-radius: 50%; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5); cursor: grab; }
            .marcador-epicentro:active { cursor: grabbing; }
            .marcador-epicentro::before { content: ''; position: absolute; top: -20px; left: -20px; right: -20px; bottom: -20px; border: 3px solid #dc3545; border-radius: 50%; animation: pulsoRadar 1.5s linear infinite; }
            .marcador-epicentro::after { content: '🚨'; font-size: 18px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
            @keyframes pulsoRadar { 0% { transform: scale(0.3); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        `;
        document.head.appendChild(style);
    },

    // ==========================================
    // 1. GESTIÓN DE VISTAS
    // ==========================================
    cambiarVista: function(vistaDestino) {
        ['vista-login', 'vista-estudiante', 'vista-inspector', 'vista-apoderado'].forEach(v => {
            document.getElementById(v)?.classList.add('oculto');
            document.getElementById(v)?.classList.remove('animate__fadeIn');
        });

        const vistaActiva = document.getElementById(`vista-${vistaDestino}`);
        if (vistaActiva) {
            vistaActiva.classList.remove('oculto');
            vistaActiva.classList.add('animate__fadeIn');
        }

        if (vistaDestino === 'inspector') {
            setTimeout(() => this.inicializarMapa(), 200);
        } else if (vistaDestino === 'apoderado') {
            this.cargarComunicados(); 
        }
    },

    // ==========================================
    // 2. MENÚ SIDEBAR INSPECTOR (INTERACTIVIDAD)
    // ==========================================
    menuInspector: function(opcion) {
        document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => {
            el.classList.remove('active', 'bg-primary', 'text-white');
            el.classList.add('bg-transparent', 'text-white-50');
        });

        if (opcion === 'dashboard') {
            document.getElementById('nav-dashboard').classList.add('active', 'bg-primary', 'text-white');
            document.getElementById('nav-dashboard').classList.remove('bg-transparent', 'text-white-50');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } 
        else if (opcion === 'mapa') {
            document.getElementById('nav-mapa').classList.add('active', 'bg-primary', 'text-white');
            document.getElementById('nav-mapa').classList.remove('bg-transparent', 'text-white-50');
            document.getElementById('seccion-mapa')?.scrollIntoView({ behavior: 'smooth' });
        }
        else if (opcion === 'historial') {
            const alertasBD = JSON.parse(localStorage.getItem('safeSchool_alertas')) || [];
            let tablaHTML = `<table class="table table-sm table-striped text-start mt-3">
                                <thead><tr><th>Hora</th><th>Emisor (Oculto)</th><th>Tipo</th><th>Detalle</th></tr></thead><tbody>`;
            
            if (alertasBD.length === 0) tablaHTML += `<tr><td colspan="4" class="text-center">No hay registros</td></tr>`;
            
            alertasBD.reverse().forEach(a => {
                tablaHTML += `<tr>
                                <td>${a.hora}</td>
                                <td class="fw-bold text-primary">${a.estudiante_nombre} (${a.estudiante_curso})</td>
                                <td><span class="badge bg-danger">${a.tipo}</span></td>
                                <td>${a.detalles}</td>
                              </tr>`;
            });
            tablaHTML += `</tbody></table>`;

            Swal.fire({ title: '<i class="bi bi-clock-history"></i> Historial Confidencial', html: tablaHTML, width: '800px', confirmButtonText: 'Cerrar' });
        }
    },

    // ==========================================
    // 3. COMUNICADOS OFICIALES (DIRECCIÓN -> APODERADOS)
    // ==========================================
    crearComunicado: async function() {
        const { value: formValues } = await Swal.fire({
            title: 'Emitir Comunicado Oficial',
            html: `
                <select id="tipo-aviso" class="form-select mb-3">
                    <option value="Dirección">📌 Aviso de Dirección</option>
                    <option value="Inspectoría">🛡️ Aviso de Inspectoría</option>
                    <option value="Evento">📅 Evento Escolar</option>
                </select>
                <textarea id="texto-aviso" class="form-control" rows="4" placeholder="Escribe el mensaje para los apoderados..."></textarea>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Publicar',
            confirmButtonColor: '#198754',
            preConfirm: () => {
                return { tipo: document.getElementById('tipo-aviso').value, texto: document.getElementById('texto-aviso').value }
            }
        });

        if (formValues && formValues.texto.trim() !== '') {
            const nuevoAviso = {
                id: 'COM-' + Date.now(), tipo: formValues.tipo, texto: formValues.texto,
                fecha: new Date().toLocaleDateString('es-CL'), hora: new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})
            };

            let comunicadosBD = JSON.parse(localStorage.getItem('safeSchool_comunicados')) || [];
            comunicadosBD.push(nuevoAviso);
            localStorage.setItem('safeSchool_comunicados', JSON.stringify(comunicadosBD));
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Comunicado Publicado', showConfirmButton: false, timer: 2500 });
        }
    },

    cargarComunicados: function() {
        const comunicadosBD = JSON.parse(localStorage.getItem('safeSchool_comunicados')) || [];
        const feedUI = document.getElementById('feed-comunicados');
        if (!feedUI) return;

        feedUI.innerHTML = '';
        if (comunicadosBD.length === 0) {
            feedUI.innerHTML = `<div class="text-center text-muted p-5 bg-white rounded-4 border"><i class="bi bi-envelope-paper fs-1 opacity-50"></i><p class="mt-3">No hay comunicados recientes.</p></div>`;
            return;
        }

        const estilosAviso = {
            'Dirección': 'border-primary text-primary bg-primary',
            'Inspectoría': 'border-danger text-danger bg-danger',
            'Evento': 'border-success text-success bg-success'
        };

        comunicadosBD.reverse().forEach(aviso => {
            const clase = estilosAviso[aviso.tipo];
            feedUI.innerHTML += `
                <div class="card border-0 shadow-sm rounded-4 border-start border-4 ${clase.split(' ')[0]} animate__animated animate__fadeInUp">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge ${clase.split(' ')[2]} bg-opacity-10 ${clase.split(' ')[1]} border px-2 py-1"><i class="bi bi-tag-fill me-1"></i>${aviso.tipo}</span>
                            <small class="text-muted"><i class="bi bi-clock"></i> ${aviso.fecha} - ${aviso.hora}</small>
                        </div>
                        <p class="mb-0 text-dark mt-3" style="white-space: pre-wrap;">${aviso.texto}</p>
                    </div>
                </div>
            `;
        });
    },

    // ==========================================
    // 4. MODO ESTUDIANTE: DISPARO DE ALERTAS CON INFO ADICIONAL
    // ==========================================
    enviarAlertaSOS: function(tipoAlerta = 'S.O.S Emergencia') {
        Swal.fire({ title: 'Conectando al GPS...', html: `Ubicando dispositivo...`, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

        if (!navigator.geolocation) { Swal.fire('Error', 'Sin GPS.', 'error'); return; }

        navigator.geolocation.getCurrentPosition(
            async (posicion) => {
                const lat = posicion.coords.latitude; const lng = posicion.coords.longitude; const precision = Math.round(posicion.coords.accuracy);
                Swal.close();

                // Aquí el estudiante incorpora información valiosa de manera opcional
                const { value: detallesInfo } = await Swal.fire({
                    title: `Reporte: ${tipoAlerta}`, 
                    text: '(Opcional) ¿Puedes darnos más detalles de lo que está ocurriendo?', 
                    input: 'textarea',
                    inputPlaceholder: 'Ej: Hay dos alumnos peleando cerca de los baños, un compañero se desmayó...',
                    showCancelButton: true, 
                    confirmButtonText: 'Enviar Alerta', 
                    cancelButtonText: 'Omitir y Enviar', 
                    confirmButtonColor: '#dc3545'
                });

                // Construcción de la Alerta: Se guarda la info real del alumno pero se envía con un flag público de anónimo
                const nuevaAlerta = {
                    id: 'ALRT-' + Date.now().toString().slice(-5),
                    estudiante_nombre: this.usuarioActual.nombre,
                    estudiante_curso: this.usuarioActual.curso,
                    estudiante_rut: this.usuarioActual.matricula,
                    tipo: tipoAlerta,
                    detalles: detallesInfo || 'El estudiante no proporcionó detalles adicionales.', 
                    lat: lat, lng: lng, precision: precision,
                    hora: new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})
                };

                let alertasBD = JSON.parse(localStorage.getItem('safeSchool_alertas')) || []; alertasBD.push(nuevaAlerta);
                localStorage.setItem('safeSchool_alertas', JSON.stringify(alertasBD));
                try { new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play(); } catch(e) {}

                Swal.fire({ icon: 'success', title: '¡Alerta Emitida!', text: 'Mantén la calma. Tu reporte ha sido enviado de forma anónima.', showConfirmButton: false, timer: 3000 });
            },
            (error) => { Swal.fire('Señal Débil', 'Activa el GPS.', 'warning'); },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
        );
    },

    // ==========================================
    // 5. MODO INSPECTOR: INICIALIZACIÓN DE MAPA
    // ==========================================
    inicializarMapa: function() {
        if (this.mapa !== null) return; 
        this.inyectarEstilos(); 
        this.mapa = L.map('mapa-liceo', { zoomSnap: 0.5 }).setView(this.coordenadasLiceo, 20.5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 24, maxNativeZoom: 19 }).addTo(this.mapa);

        this.capaZonas = new L.FeatureGroup().addTo(this.mapa);
        this.capaPuntos = new L.FeatureGroup().addTo(this.mapa);
        this.capaAlertas = new L.LayerGroup().addTo(this.mapa);

        L.control.layers(null, { "🏫 Sectores": this.capaZonas, "📹 Cámaras": this.capaPuntos, "🚨 Alertas GPS": this.capaAlertas }, { collapsed: false }).addTo(this.mapa);

        this.cargarDatosPersistentes();
        this.habilitarDibujoDinamico();
        setInterval(() => this.sincronizarAlertas(), 2000);
    },

    // ==========================================
    // 6. PERSISTENCIA DE MAPA (ZONAS Y PUNTOS)
    // ==========================================
    cargarDatosPersistentes: function() {
        let zonasBD = JSON.parse(localStorage.getItem('safeSchool_zonas'));
        if (!zonasBD || zonasBD.length === 0) {
            zonasBD = [
                { id: 'Z-01', nombre: 'Pabellón Principal', estado: 'segura', coords: [ [-33.537150, -70.636600], [-33.537150, -70.635800], [-33.537550, -70.635800], [-33.537550, -70.636600] ] },
                { id: 'Z-02', nombre: 'Edificio Norte', estado: 'segura', coords: [ [-33.536550, -70.636600], [-33.536550, -70.635500], [-33.536850, -70.635500], [-33.536850, -70.636600] ] }
            ];
            localStorage.setItem('safeSchool_zonas', JSON.stringify(zonasBD));
        }

        zonasBD.forEach(zona => {
            const poligono = L.polygon(zona.coords, { color: this.obtenerColorRiesgo(zona.estado), fillColor: this.obtenerColorRiesgo(zona.estado), fillOpacity: 0.3, weight: 2, className: 'zona-interactiva' });
            poligono.zonaDatos = zona;
            this.actualizarTooltipZona(poligono);
            poligono.on('click', () => this.gestionarZona(poligono));
            poligono.addTo(this.capaZonas);
        });

        let puntosBD = JSON.parse(localStorage.getItem('safeSchool_puntos'));
        if (!puntosBD || puntosBD.length === 0) {
            puntosBD = [
                { id: 'P-01', nombre: 'Cámara Acceso', tipo: 'camara', lat: -33.537750, lng: -70.636200 },
                { id: 'P-02', nombre: 'Cámara Patio', tipo: 'camara', lat: -33.537050, lng: -70.636150 }
            ];
            localStorage.setItem('safeSchool_puntos', JSON.stringify(puntosBD));
        }

        puntosBD.forEach(punto => {
            const marcador = L.marker([punto.lat, punto.lng], { icon: this.obtenerIconoPunto(punto.tipo), draggable: true });
            marcador.puntoDatos = punto;
            this.actualizarTooltipPunto(marcador);
            
            marcador.on('dragend', (e) => {
                const nP = e.target.getLatLng(); marcador.puntoDatos.lat = nP.lat; marcador.puntoDatos.lng = nP.lng;
                this.guardarPuntosEnBD();
            });
            marcador.addTo(this.capaPuntos);
        });
    },

    guardarZonasEnBD: function() {
        const arr = [];
        this.capaZonas.eachLayer(l => { if (l.zonaDatos) { l.zonaDatos.coords = l.getLatLngs()[0].map(p => [p.lat, p.lng]); arr.push(l.zonaDatos); } });
        localStorage.setItem('safeSchool_zonas', JSON.stringify(arr));
    },

    guardarPuntosEnBD: function() {
        const arr = []; this.capaPuntos.eachLayer(l => { if (l.puntoDatos) arr.push(l.puntoDatos); });
        localStorage.setItem('safeSchool_puntos', JSON.stringify(arr));
    },

    obtenerColorRiesgo: function(estado) { return estado === 'segura' ? '#198754' : (estado === 'advertencia' ? '#ffc107' : '#dc3545'); },
    obtenerIconoPunto: function(tipo) { return tipo === 'camara' ? L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3203/3203071.png', iconSize: [28, 28] }) : L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/595/595067.png', iconSize: [35, 35] }); },

    actualizarTooltipZona: function(poligono) {
        let area = 0; const latlngs = poligono.getLatLngs()[0];
        for (let i = 0; i < latlngs.length; i++) {
            let p1 = this.mapa.options.crs.project(latlngs[i]); let p2 = this.mapa.options.crs.project(latlngs[(i + 1) % latlngs.length]);
            area += (p1.x * p2.y) - (p2.x * p1.y);
        }
        poligono.bindTooltip(`
            <div class="text-center">
                <b class="text-dark fs-6">${poligono.zonaDatos.nombre}</b><br><small>Área: <b>${Math.round(Math.abs(area / 2))} m²</b></small><br>
                <span class="badge ${poligono.zonaDatos.estado === 'segura' ? 'bg-success' : (poligono.zonaDatos.estado === 'advertencia' ? 'bg-warning text-dark' : 'bg-danger')}">${poligono.zonaDatos.estado.toUpperCase()}</span>
            </div>
        `, { permanent: true, direction: 'center', className: 'bg-transparent border-0 shadow-none' });
    },

    actualizarTooltipPunto: function(marcador) {
        const d = marcador.puntoDatos;
        marcador.bindPopup(`<div class="text-center">${d.tipo === 'camara' ? `<b>${d.nombre}</b><br><span class="badge bg-success mb-2">En línea</span>` : `<b class="text-danger">Peligro</b><br>${d.nombre}`}</div>`);
    },

    gestionarZona: function(poligonoLeaflet) {
        if (this.mapa.pm && (this.mapa.pm.globalEditModeEnabled() || this.mapa.pm.globalRemovalModeEnabled())) return;
        const z = poligonoLeaflet.zonaDatos;
        Swal.fire({
            title: `Modificar Zona`, html: `<b>${z.nombre}</b>`, input: 'radio',
            inputOptions: { 'segura': '🟢 Segura', 'advertencia': '🟡 Compleja', 'critica': '🔴 Crítica' }, inputValue: z.estado,
            showCancelButton: true, confirmButtonText: 'Actualizar', confirmButtonColor: '#0d6efd'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                z.estado = result.value; const col = this.obtenerColorRiesgo(z.estado);
                poligonoLeaflet.setStyle({ color: col, fillColor: col }); this.actualizarTooltipZona(poligonoLeaflet); this.guardarZonasEnBD(); 
            }
        });
    },

    habilitarDibujoDinamico: function() {
        if (!this.mapa.pm) return;
        this.mapa.pm.setLang('es');
        this.mapa.pm.addControls({ position: 'topleft', drawMarker: true, drawRectangle: true, drawPolygon: true, editMode: true, dragMode: true, removalMode: true, drawCircleMarker: false, drawPolyline: false, drawCircle: false, drawText: false, cutPolygon: false, rotateMode: false });
        this.mapa.pm.setPathOptions({ color: '#198754', fillColor: '#198754', fillOpacity: 0.3, weight: 2 });

        this.mapa.on('pm:create', async (event) => {
            const capa = event.layer;
            if (event.shape === 'Marker') {
                const { value: tipo } = await Swal.fire({ title: 'Nuevo Marcador', input: 'select', inputOptions: { 'camara': '📹 Cámara', 'peligro': '⚠️ Zona de Riesgo' }, showCancelButton: true, confirmButtonText: 'Continuar' });
                if (!tipo) { this.mapa.removeLayer(capa); return; }
                const { value: nombre } = await Swal.fire({ title: 'Identificador', input: 'text', showCancelButton: true });
                if (nombre) {
                    const pos = capa.getLatLng(); capa.puntoDatos = { id: 'P-' + Date.now(), nombre: nombre, tipo: tipo, lat: pos.lat, lng: pos.lng };
                    capa.setIcon(this.obtenerIconoPunto(tipo)); this.actualizarTooltipPunto(capa);
                    capa.on('dragend', (e) => { const nP = e.target.getLatLng(); capa.puntoDatos.lat = nP.lat; capa.puntoDatos.lng = nP.lng; this.guardarPuntosEnBD(); });
                    this.capaPuntos.addLayer(capa); this.guardarPuntosEnBD();
                } else { this.mapa.removeLayer(capa); }
            } 
            else {
                const { value: nombre } = await Swal.fire({ title: 'Nombre del Sector', input: 'text', showCancelButton: true });
                if (nombre) {
                    capa.zonaDatos = { id: 'Z-' + Date.now(), nombre: nombre, estado: 'segura', coords: capa.getLatLngs()[0].map(p => [p.lat, p.lng]) };
                    capa.setStyle({ className: 'zona-interactiva' }); this.actualizarTooltipZona(capa); capa.on('click', () => this.gestionarZona(capa));
                    this.capaZonas.addLayer(capa); this.guardarZonasEnBD();
                } else { this.mapa.removeLayer(capa); }
            }
        });

        this.mapa.on('pm:update', (event) => { if (event.layer.zonaDatos) { this.actualizarTooltipZona(event.layer); this.guardarZonasEnBD(); } });
        this.mapa.on('pm:remove', (event) => { if (event.layer.zonaDatos) this.guardarZonasEnBD(); if (event.layer.puntoDatos) this.guardarPuntosEnBD(); });
    },

    // ==========================================
    // 7. SINCRONIZACIÓN DE ALERTAS EN VIVO Y REVELACIÓN DE IDENTIDAD
    // ==========================================
    sincronizarAlertas: function() {
        if (!this.mapa || this.isDraggingAlert) return; 

        const alertasBD = JSON.parse(localStorage.getItem('safeSchool_alertas')) || [];
        const listaUI = document.getElementById('feed-alertas');
        const statAlarmas = document.getElementById('stat-alarmas');
        
        if (statAlarmas) statAlarmas.textContent = alertasBD.length;
        if (alertasBD.length === 0) {
            if (document.getElementById('sin-alertas')) return; 
            this.capaAlertas.clearLayers();
            if (listaUI) listaUI.innerHTML = `<div class="text-center text-muted p-4" id="sin-alertas"><i class="bi bi-shield-check fs-1 text-success"></i><p>Sin incidentes recientes.</p></div>`;
            return;
        }
        
        document.getElementById('sin-alertas')?.remove();
        this.capaAlertas.clearLayers();
        if (listaUI) listaUI.innerHTML = '';

        const iconoRadar = L.divIcon({ className: 'div-icon-radar', html: `<div class="marcador-epicentro"></div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
        const alertasReversa = [...alertasBD].reverse();

        alertasReversa.forEach(alerta => {
            const marcador = L.marker([alerta.lat, alerta.lng], { icon: iconoRadar, draggable: true }).bindPopup(`
                <strong class="text-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${alerta.tipo.toUpperCase()}</strong><br>
                <div class="p-2 bg-light border rounded mt-1 mb-1" style="max-width: 200px;"><small><b>Detalles:</b> ${alerta.detalles}</small></div>
                <small class="text-muted">Hora: ${alerta.hora}</small><br>
                <button class="btn btn-sm btn-outline-danger w-100 mt-2 fw-bold" onclick="app.revelarIdentidad('${alerta.id}')">
                    <i class="bi bi-person-bounding-box"></i> Revelar Identidad Privada
                </button>
            `);

            marcador.on('dragstart', () => { this.isDraggingAlert = true; marcador.closePopup(); });
            marcador.on('dragend', (e) => {
                const nPos = e.target.getLatLng(); const index = alertasBD.findIndex(a => a.id === alerta.id);
                if (index > -1) { alertasBD[index].lat = nPos.lat; alertasBD[index].lng = nPos.lng; localStorage.setItem('safeSchool_alertas', JSON.stringify(alertasBD)); }
                setTimeout(() => { this.isDraggingAlert = false; }, 500);
            });
            this.capaAlertas.addLayer(marcador);

            // En la lista lateral (Feed), la identidad sigue mostrándose como ANÓNIMA
            if (listaUI) {
                listaUI.innerHTML += `
                    <div class="p-3 bg-danger bg-opacity-10 border-start border-danger border-4 rounded-3 mb-2 shadow-sm">
                        <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                            <h6 class="mb-0 fw-bold text-danger"><i class="bi bi-exclamation-octagon"></i> ${alerta.tipo}</h6>
                            <small class="fw-bold text-danger">${alerta.hora}</small>
                        </div>
                        <small class="text-muted mb-1 d-block"><i class="bi bi-incognito"></i> Estudiante Anónimo</small>
                        <p class="small text-dark mb-1 fst-italic bg-white p-2 rounded border">"${alerta.detalles}"</p>
                        <button class="btn btn-sm btn-danger w-100 mt-2" onclick="app.mapa.setView([${alerta.lat}, ${alerta.lng}], 22)">Centrar en Radar</button>
                    </div>
                `;
            }
        });
    },

    // El Inspector presiona el botón en el mapa para revelar quién es el estudiante real
    revelarIdentidad: function(idAlerta) {
        const alertasBD = JSON.parse(localStorage.getItem('safeSchool_alertas')) || [];
        const alertaEncontrada = alertasBD.find(a => a.id === idAlerta);
        
        if (!alertaEncontrada) return;

        Swal.fire({ 
            icon: 'warning', 
            title: 'Identidad Revelada', 
            html: `
                <div class="text-start bg-light p-3 rounded border">
                    <b class="text-dark">Nombre:</b> <span class="text-primary">${alertaEncontrada.estudiante_nombre}</span><br>
                    <b class="text-dark">Curso:</b> ${alertaEncontrada.estudiante_curso}<br>
                    <b class="text-dark">RUT / Matrícula:</b> <code>${alertaEncontrada.estudiante_rut}</code>
                </div>
                <div class="mt-3 small text-muted text-center"><i class="bi bi-lock-fill"></i> Esta información es estrictamente confidencial para uso exclusivo de Inspectoría y Dirección.</div>
            `, 
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Cerrar Registro'
        });
    },

    limpiarAlertasMapa: function() {
        Swal.fire({ title: '¿Restablecer Paz?', text: 'Se eliminarán las alertas.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Restablecer', confirmButtonColor: '#198754'
        }).then((result) => { if (result.isConfirmed) { localStorage.setItem('safeSchool_alertas', JSON.stringify([])); this.sincronizarAlertas(); } });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-alerta-general')?.addEventListener('click', () => {
        try { new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg').play(); } catch(e) {}
        Swal.fire({ title: 'ALERTA GENERAL', text: 'Evacuación requerida', icon: 'error', confirmButtonColor: '#d33' });
    });
});