# Sussy's Vet

Aplicación web estática para la clínica veterinaria Sussy's Vet. Incluye acceso con Supabase Auth, paneles según el rol y el generador de fórmulas médicas existente.

## Funcionalidades implementadas

- Inicio de sesión por correo y contraseña con redirección por rol: administrador, veterinario o propietario.
- Recuperación de contraseña por correo y formulario para establecer la nueva contraseña. Los correos y enlaces dependen de la configuración de Auth y SMTP en Supabase.
- Panel de administrador con CRUD básico de veterinarios: usuario, nombre, empresa, correo y contraseña temporal opcional. Si no se suministra contraseña, Supabase envía una invitación para que la persona defina su clave.
- Panel de veterinario con acceso al generador y CRUD de propietarios y sus mascotas.
- Vista de propietario con CRUD básico de sus mascotas, preparada para cuentas enlazadas a un propietario.
- Las fórmulas quedan asociadas al veterinario que las creó. Las tablas están protegidas con Row Level Security (RLS).

> El registro público de propietarios y su vinculación automática con una cuenta quedan para una siguiente etapa. La vista de propietario está creada, y el esquema contempla `auth_user_id`, pero este flujo no se ofrece todavía desde la pantalla de acceso. El panel de administración y el panel veterinario son el alcance principal de esta etapa.

## Estructura

```text
pagina-web-sussys/
├── index.html
├── README.md
├── assets/
│   ├── firma.png
│   └── logo_sussys.png
├── css/
│   ├── dashboard.css
│   ├── formula.css
│   └── style.css
├── js/
│   ├── admin.js
│   ├── dashboard-auth.js
│   ├── formula.js
│   ├── main.js
│   ├── owner.js
│   ├── reset-password.js
│   ├── supabase-client.js
│   └── veterinarian.js
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   └── manage-veterinarian/index.ts
│   └── migrations/
│       └── 001_roles_and_clinic.sql
└── views/
    ├── admin.html
    ├── formula_medica.html
    ├── owner.html
    ├── reset-password.html
    └── veterinarian.html
```

| Ruta | Uso |
| --- | --- |
| `index.html` | Inicio de sesión, recuperación por correo y enlaces de contacto/catálogo. |
| `views/admin.html` | Gestión de veterinarios (solo rol administrador). |
| `views/veterinarian.html` | Gestión de propietarios y mascotas; acceso a fórmulas. |
| `views/formula_medica.html` | Generador de fórmulas, historial y exportación PDF. |
| `views/owner.html` | Vista de mascotas para una cuenta de propietario enlazada. |
| `views/reset-password.html` | Establecimiento de contraseña desde el enlace de recuperación. |
| `js/supabase-client.js` | Cliente Supabase del navegador; contiene solo URL y clave pública. |
| `js/dashboard-auth.js` | Verificación de sesión y rol en los paneles. |
| `js/admin.js` | Interfaz CRUD de veterinarios vía Edge Function. |
| `js/veterinarian.js` | CRUD de propietarios y mascotas del veterinario autenticado. |
| `js/owner.js` | CRUD de mascotas de propietario autenticado. |
| `js/formula.js` | Fórmulas y asociación de creador. |
| `supabase/migrations/001_roles_and_clinic.sql` | Perfiles, roles, tablas, relaciones, políticas RLS y bootstrap inicial. |
| `supabase/functions/manage-veterinarian/index.ts` | Operaciones administrativas de Auth para alta, edición y eliminación de veterinarios. |

## Configuración de Supabase

1. Crea el primer usuario administrador en **Supabase → Authentication → Users**.
2. Abre `supabase/migrations/001_roles_and_clinic.sql`, cambia `admin@tudominio.com` por el correo del usuario administrador y ejecuta el script en **SQL Editor**. El script asigna el rol de administrador a ese usuario.
3. En `js/supabase-client.js`, confirma la URL del proyecto y la clave pública `anon`/publishable. La clave pública puede estar en frontend; nunca coloques `service_role` ahí.
4. Despliega la función `manage-veterinarian` con Supabase CLI. Supabase inyecta las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` al runtime de Edge Functions; no las agregues al frontend ni al repositorio. La clave `service_role` debe permanecer solo en servidor.
5. En **Authentication → URL Configuration**, configura la URL pública de GitHub Pages como **Site URL** y agrégala a **Redirect URLs**, junto con su ruta `/views/reset-password.html`. Configura SMTP y las plantillas de correo para que se entreguen los enlaces de recuperación e invitación.

## Publicación en GitHub Pages

El repositorio remoto es [`gspcoderprogramacion/Sussy-s-Vet-Web`](https://github.com/gspcoderprogramacion/Sussy-s-Vet-Web). En la configuración estándar de GitHub Pages para un repositorio de proyecto, la dirección pública es:

<https://gspcoderprogramacion.github.io/Sussy-s-Vet-Web/>

Confirma la dirección activa en **Settings → Pages** del repositorio, especialmente si se configuró un dominio propio. Como GitHub Pages sirve este repositorio bajo el prefijo `/Sussy-s-Vet-Web/`, conserva las rutas relativas del sitio. El enlace de recuperación se calcula a partir de la URL actual, así que también mantiene ese prefijo.

En Supabase configura **Site URL** con la dirección pública activa y añade a **Redirect URLs** la URL de recuperación completa, por ejemplo:

```text
https://gspcoderprogramacion.github.io/Sussy-s-Vet-Web/views/reset-password.html
```

Si GitHub Pages publica desde una rama/carpeta, verifica en **Settings → Pages** que el origen apunte a la rama y directorio donde está `index.html`. Cada actualización del front debe llegar a esa rama para que aparezca online. Las Edge Functions y la base de datos se despliegan/configuran directamente en Supabase; GitHub Pages solo publica los archivos estáticos.

Ejemplo de despliegue de la función (con Supabase CLI enlazado al proyecto):

```bash
supabase functions deploy manage-veterinarian
```

La función comprueba la sesión y vuelve a verificar el rol de administrador en la base de datos antes de llamar a Auth Admin API.

## Ejecución local

Desde la raíz del proyecto, sirve los archivos estáticos:

```bash
python -m http.server 8000
```

Abre <http://localhost:8000>. Para el generador, accede tras iniciar sesión como veterinario en <http://localhost:8000/views/veterinarian.html>. No abras las páginas como `file://`; Auth, los enlaces de retorno y las funciones requieren un origen HTTP configurado en Supabase.

## Datos y roles

- `profiles`: cuenta Auth, nombre y rol (`admin`, `veterinarian`, `owner`). El trigger asigna `owner` por defecto a altas Auth; solo el administrador inicial y la función privilegiada asignan roles de personal.
- `veterinarian_profiles`: usuario y empresa asociados al perfil de veterinario.
- `owner_profiles`: propietarios administrados por un veterinario; permite enlace futuro a usuario Auth.
- `pets`: mascotas del propietario (o de cuenta owner enlazada).
- `formulas_medicas`: fórmulas ligadas a `created_by`; veterinarios consultan sus propias fórmulas y administradores pueden consultarlas todas.

La tabla de fórmulas existente recibe la columna `created_by`. Fórmulas antiguas sin creador no aparecerán a los veterinarios bajo RLS; asígnalas al perfil correcto de forma manual si necesitas conservar su acceso.

## Servicios externos

Supabase JS se carga desde jsDelivr; `html2pdf.js` desde cdnjs y Nunito desde Google Fonts. La recuperación e invitación dependen de la entrega de correo configurada en Supabase. Contacto y catálogo se enlazan a WhatsApp y Google Drive.
