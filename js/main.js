document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. ANIMACIÓN DE LOS 3 PANELES (Portón hacia arriba)
    // ==========================================
    const panels = document.querySelectorAll('.panel');
    const btnCloses = document.querySelectorAll('.btn-close');
    const btnHome = document.querySelector('.btn-home');

    // Función para abrir un panel
    panels.forEach(panel => {
        const cover = panel.querySelector('.cover');
        
        cover.addEventListener('click', () => {
            // Cierra todos los portones primero
            resetPanels();
            // Abre solo el portón de la columna a la que le dimos clic
            panel.classList.add('active');
        });
    });

    // Función que simplemente quita la clase 'active' de todos
    function resetPanels() {
        panels.forEach(p => {
            p.classList.remove('active');
        });
    }

    // Botones de "X" (Cierra el portón activo)
    btnCloses.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita volver a hacer clic en la portada sin querer
            resetPanels();
        });
    });

    // Enlace de Inicio en la barra de navegación (Cierra todos)
    if(btnHome) {
        btnHome.addEventListener('click', (e) => {
            e.preventDefault();
            resetPanels();
        });
    }

    // ==========================================
    // 2. CONEXIÓN A SUPABASE (Lista para uso futuro)
    // ==========================================
    const SUPABASE_URL = 'https://kpasfvlaashsiovzxxbk.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_skZ7tGL7cTyqKox3A1g9YA_hd8MWRIO';
    
    // Inicializamos el cliente. Lo usarás luego para login y registro.
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ==========================================
    // 3. PREVENCIÓN FORMULARIOS LOGIN/REGISTRO
    // ==========================================
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if(registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('🛠️ La función de crear cuenta está en construcción.');
        });
    }

    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('🛠️ La función de iniciar sesión está en construcción.');
        });
    }
});