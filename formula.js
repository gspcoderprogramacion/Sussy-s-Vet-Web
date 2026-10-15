(function() {
    // ==========================================
    // 0. AUTO-COMPLETAR FECHA ACTUAL
    // ==========================================
    function setFechaActual() {
        const hoy = new Date();
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const mesActual = meses[hoy.getMonth()];
        const fechaFormateada = mesActual + " " + hoy.getDate() + "/" + hoy.getFullYear();
        
        const spanFecha = document.getElementById('fecha-texto');
        if(spanFecha) spanFecha.innerText = fechaFormateada;
    }

    setFechaActual();

    // ==========================================
    // 1. CONFIGURACIÓN DE SUPABASE
    // ==========================================
    const SUPABASE_URL = 'https://kpasfvlaashsiovzxxbk.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_skZ7tGL7cTyqKox3A1g9YA_hd8MWRIO';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let idFormulaActual = null;

    // ==========================================
    // 2. AUTO-EXPANDIR LOS TEXTAREAS MANUALES
    // ==========================================
    const txtMedicamentos = document.getElementById('medicamentos');
    const txtRecomendaciones = document.getElementById('recomendaciones');

    function autoResizeTextarea(el) {
        if(!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }

    if(txtMedicamentos) txtMedicamentos.addEventListener('input', function() { autoResizeTextarea(this); });
    if(txtRecomendaciones) txtRecomendaciones.addEventListener('input', function() { autoResizeTextarea(this); });

    // ==========================================
    // 3. GUARDAR, ACTUALIZAR Y CARGAR (SUPABASE)
    // ==========================================
    window.guardarFormula = async function() {
        const dataToSave = {
            fecha: document.getElementById('fecha-texto') ? document.getElementById('fecha-texto').innerText : '',
            nombre_paciente: document.getElementById('nombre') ? document.getElementById('nombre').value : '',
            especie: document.getElementById('especie') ? document.getElementById('especie').value : '',
            raza: document.getElementById('raza') ? document.getElementById('raza').value : '',
            sexo: document.getElementById('sexo') ? document.getElementById('sexo').value : '',
            edad: document.getElementById('edad') ? document.getElementById('edad').value : '',
            medicamentos: txtMedicamentos ? [txtMedicamentos.value] : [], 
            recomendaciones: txtRecomendaciones ? [txtRecomendaciones.value] : []
        };

        let result;
        if (idFormulaActual) {
            result = await supabase.from('formulas_medicas').update(dataToSave).eq('id', idFormulaActual).select();
        } else {
            result = await supabase.from('formulas_medicas').insert([dataToSave]).select();
        }

        const { data, error } = result;

        if (error) {
            alert("Error al guardar: " + error.message);
        } else {
            idFormulaActual = data[0].id;
            const loadInput = document.getElementById('load-id');
            if(loadInput) loadInput.value = idFormulaActual;
            alert("✅ Fórmula guardada correctamente.\n\nID: " + idFormulaActual);
        }
    };

    window.crearCopia = function() {
        const nombreInput = document.getElementById('nombre');
        if(!nombreInput || !nombreInput.value) {
            alert("Llene los datos de la fórmula antes de crear una copia.");
            return;
        }
        idFormulaActual = null; 
        setFechaActual();
        const loadInput = document.getElementById('load-id');
        if(loadInput) loadInput.value = '';
        window.guardarFormula();
    };

    window.cargarFormulaPorId = async function(id) {
        if(!id) return;
        const { data, error } = await supabase.from('formulas_medicas').select('*').eq('id', id).single();

        if (error || !data) {
            return alert("No se encontró ninguna fórmula con ese ID.");
        }

        idFormulaActual = data.id;
        const loadInput = document.getElementById('load-id');
        if(loadInput) loadInput.value = data.id;

        if(document.getElementById('fecha-texto')) document.getElementById('fecha-texto').innerText = data.fecha || '';
        if(document.getElementById('nombre')) document.getElementById('nombre').value = data.nombre_paciente || '';
        if(document.getElementById('especie')) document.getElementById('especie').value = data.especie || '';
        if(document.getElementById('raza')) document.getElementById('raza').value = data.raza || '';
        if(document.getElementById('sexo')) document.getElementById('sexo').value = data.sexo || '';
        if(document.getElementById('edad')) document.getElementById('edad').value = data.edad || '';

        if(txtMedicamentos) {
            txtMedicamentos.value = (data.medicamentos && data.medicamentos.length > 0) ? data.medicamentos[0] : '';
            autoResizeTextarea(txtMedicamentos);
        }
        if(txtRecomendaciones) {
            txtRecomendaciones.value = (data.recomendaciones && data.recomendaciones.length > 0) ? data.recomendaciones[0] : '';
            autoResizeTextarea(txtRecomendaciones);
        }
    };

    window.cargarFormula = async function() {
        const loadInput = document.getElementById('load-id');
        const id = loadInput ? loadInput.value.trim() : '';
        if(!id) return alert("Por favor ingresa un ID válido.");
        await window.cargarFormulaPorId(id);
        alert("📂 Fórmula cargada con éxito. Puedes editarla.");
    };

    // ==========================================
    // 4. HISTORIAL DE ÚLTIMAS 50
    // ==========================================
    window.abrirHistorial = async function() {
        const modal = document.getElementById('modal-historial');
        const tbody = document.getElementById('tabla-historial-body');
        if(!modal || !tbody) return;

        modal.style.display = 'flex';
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Cargando registros...</td></tr>`;

        const { data, error } = await supabase
            .from('formulas_medicas')
            .select('id, fecha, nombre_paciente, especie, raza, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if(error) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar: ${error.message}</td></tr>`;
            return;
        }

        if(!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay fórmulas guardadas todavía.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.nombre_paciente || 'Sin nombre'}</strong></td>
                <td>${item.especie || 'N/A'}</td>
                <td>${item.raza || 'N/A'}</td>
                <td>${item.fecha || 'Sin fecha'}</td>
                <td><button class="btn btn-blue" style="padding: 5px 10px; font-size: 0.8rem;" onclick="seleccionarDesdeHistorial('${item.id}')">✏️ Editar</button></td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.cerrarHistorial = function() {
        const modal = document.getElementById('modal-historial');
        if(modal) modal.style.display = 'none';
    };

    window.seleccionarDesdeHistorial = async function(id) {
        window.cerrarHistorial();
        await window.cargarFormulaPorId(id);
        alert("📂 Fórmula cargada correctamente desde el historial.");
    };

    // ==========================================
    // 5. GENERAR PDF (Con seguridad CORS para imágenes locales)
    // ==========================================
    window.generarPDF = function() {
        const elemento = document.getElementById('documento-pdf');
        const nombreInput = document.getElementById('nombre');
        const nombreMascota = nombreInput && nombreInput.value ? nombreInput.value.trim() : 'Paciente';
        
        if (!elemento) {
            alert("No se encontró el contenedor del documento.");
            return;
        }

        elemento.classList.add('pdf-mode');

        const opciones = {
            margin:       0,
            filename:     `Formula_${nombreMascota}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                allowTaint: true // Evita que falle al procesar PNGs locales
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opciones).from(elemento).save().then(() => {
            elemento.classList.remove('pdf-mode');
        }).catch(err => {
            console.error(err);
            alert("Hubo un error al generar el PDF.");
            elemento.classList.remove('pdf-mode');
        });
    };
})();