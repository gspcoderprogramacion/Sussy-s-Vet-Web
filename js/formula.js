(async function() {
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
    const supabase = window.supabaseClient;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.replace('../index.html'); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'veterinarian' && profile?.role !== 'admin') { window.location.replace('../index.html'); return; }
    const menuPrincipal = document.getElementById('menu-principal');
    if (menuPrincipal && profile.role === 'admin') menuPrincipal.href = 'admin.html';
    const currentUserId = session.user.id;

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
    async function persistirFormula() {
        const dataToSave = {
            fecha: document.getElementById('fecha-texto') ? document.getElementById('fecha-texto').innerText : '',
            created_by: currentUserId,
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
        if (error) throw error;

        if (!data?.[0]?.id) throw new Error('No se pudo confirmar el registro guardado.');
        idFormulaActual = data[0].id;
        const loadInput = document.getElementById('load-id');
        if(loadInput) loadInput.value = idFormulaActual;
        return idFormulaActual;
    }

    window.guardarFormula = async function() {
        try {
            const id = await persistirFormula();
            alert("✅ Fórmula guardada correctamente.\n\nID: " + id);
        } catch (error) {
            alert("Error al guardar: " + error.message);
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
    // 5. Preparar el documento para exportar o imprimir
    // ==========================================
    function prepareDocumentOutput() {
        const elemento = document.getElementById('documento-pdf');
        if (!elemento) throw new Error('No se encontró el documento de la fórmula.');
        const replacements = [];

        ['medicamentos', 'recomendaciones'].forEach(id => {
            const textarea = document.getElementById(id);
            if (!textarea) return;
            const textBlock = document.createElement('div');
            textBlock.className = textarea.className;
            textBlock.textContent = textarea.value;
            textBlock.style.height = 'auto';
            textBlock.style.minHeight = '0';
            textBlock.style.whiteSpace = 'pre-wrap';
            textBlock.style.overflowWrap = 'anywhere';
            textarea.parentNode.replaceChild(textBlock, textarea);
            replacements.push({ textarea, textBlock });
        });

        elemento.classList.add('pdf-mode');
        return () => {
            elemento.classList.remove('pdf-mode');
            replacements.forEach(({ textarea, textBlock }) => {
                if (textBlock.parentNode) textBlock.parentNode.replaceChild(textarea, textBlock);
            });
        };
    };

    window.generarPDF = async function() {
        const elemento = document.getElementById('documento-pdf');
        const nombreInput = document.getElementById('nombre');
        const nombreMascota = (nombreInput?.value || 'Paciente').trim().replace(/[\\/:*?"<>|]/g, '_');
        let restore = null;
        try {
            await persistirFormula();
            restore = prepareDocumentOutput();
            await document.fonts.ready;
            await Promise.all(Array.from(elemento.querySelectorAll('img')).map(img => img.decode().catch(() => {})));

            const canvas = await html2canvas(elemento, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                width: elemento.scrollWidth,
                height: elemento.scrollHeight,
                windowWidth: Math.max(document.documentElement.clientWidth, elemento.scrollWidth),
                windowHeight: Math.max(window.innerHeight, elemento.scrollHeight)
            });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const fit = Math.min((pageWidth - margin * 2) / canvas.width, (pageHeight - margin * 2) / canvas.height);
            const imageWidth = canvas.width * fit;
            const imageHeight = canvas.height * fit;
            const image = canvas.toDataURL('image/jpeg', 0.96);
            pdf.addImage(image, 'JPEG', (pageWidth - imageWidth) / 2, (pageHeight - imageHeight) / 2, imageWidth, imageHeight, undefined, 'FAST');
            pdf.save(`Formula_${nombreMascota || 'Paciente'}.pdf`);
        } catch (error) {
            console.error(error);
            alert('No se pudo guardar la fórmula o generar el PDF: ' + error.message);
        } finally {
            if (restore) restore();
        }
    };

    window.imprimirFormula = function() {
        let restore = null;
        const elemento = document.getElementById('documento-pdf');
        try {
            restore = prepareDocumentOutput();
            const pageHeightPx = 297 * 96 / 25.4;
            const scale = Math.min(1, pageHeightPx / elemento.scrollHeight);
            elemento.style.setProperty('--print-scale', scale.toFixed(4));
            window.print();
        } finally {
            if (restore) restore();
            elemento?.style.removeProperty('--print-scale');
        }
    };
})();

