# Sussy's Vet

Sitio web estático para Sussy's Vet. Incluye una página de bienvenida con acceso a contacto y catálogo, y una herramienta para crear y administrar fórmulas médicas veterinarias.

## Funcionalidades

- Página de inicio con paneles interactivos de registro, acceso y contacto.
- Enlace a WhatsApp para solicitar una cita y acceso al catálogo alojado en Google Drive.
- Generador de fórmulas veterinarias con datos de mascota, medicamentos y recomendaciones.
- Guardado, actualización, carga por ID e historial reciente mediante Supabase.
- Descarga de fórmulas en PDF.

> El registro y el acceso desde la página principal muestran mensajes indicando que están en construcción. El enlace “Entrar” lleva actualmente al generador de fórmulas.

## Estructura del proyecto

```text
pagina-web-sussys/
├── index.html
├── README.md
├── assets/
│   ├── firma.png
│   └── logo_sussys.png
├── css/
│   ├── formula.css
│   └── style.css
├── js/
│   ├── formula.js
│   └── main.js
└── views/
    └── formula_medica.html
```

| Ruta | Descripción |
| --- | --- |
| `index.html` | Página principal con paneles de registro, acceso y contacto. |
| `views/formula_medica.html` | Interfaz del generador de fórmulas e historial. |
| `css/style.css` | Estilos de la página principal. |
| `css/formula.css` | Estilos del generador y del documento imprimible. |
| `js/main.js` | Interacciones de los paneles y formularios de inicio. |
| `js/formula.js` | Guardado/carga de fórmulas, historial y exportación a PDF. |
| `assets/logo_sussys.png` | Logotipo y favicon. |
| `assets/firma.png` | Firma incluida en la fórmula médica. |

## Ejecución local

No requiere compilación ni instalación de paquetes. Desde la carpeta raíz del proyecto, inicia un servidor estático:

```bash
python -m http.server 8000
```

Abre <http://localhost:8000> para la página principal y <http://localhost:8000/views/formula_medica.html> para el generador. Servir el proyecto desde la raíz conserva las rutas relativas entre páginas, estilos, scripts e imágenes.

## Supabase y dependencias externas

El generador consulta la tabla `formulas_medicas` en Supabase. Se requieren la tabla y políticas de acceso apropiadas para las columnas `id`, `fecha`, `nombre_paciente`, `especie`, `raza`, `sexo`, `edad`, `medicamentos`, `recomendaciones` y `created_at`.

El cliente de Supabase se carga desde jsDelivr; html2pdf.js se carga desde cdnjs y Nunito desde Google Fonts. Estas funciones requieren conexión a internet.

## Notas

- El historial presenta hasta 50 fórmulas recientes.
- El PDF utiliza el logotipo y la firma almacenados en `assets/`.
- El proyecto es frontend estático y no incluye servidor propio ni configuración de despliegue.
