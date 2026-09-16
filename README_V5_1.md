# Relevamiento HRN — V5.1

V5.1 conserva la funcionalidad de la V5 y corrige/reformula exclusivamente la presentación visual para una experiencia móvil consistente.

## Cambios V5.1
- Interfaz mobile-first con ancho máximo de 440 px.
- En escritorio la aplicación se presenta centrada con aspecto de aplicación móvil.
- Encabezado renovado con marca HRN, título, subtítulo y estado de conexión.
- Tarjetas y botones adaptados a operación táctil.
- Formularios y diálogos optimizados para teléfono.
- Se mantienen edición de clientes, máquinas/líneas, zonas y análisis HRN.
- Se mantienen botones de volver, fotografías, IndexedDB, PWA e instalación.
- Service Worker actualizado a `hrn-pwa-v5-1` para evitar que la V5 anterior quede servida por caché.

## Publicación GitHub Pages
Esta versión es estática. No requiere Vite ni `npm install`.
El workflow publica directamente `index.html`, `styles.css`, `app.js`, `manifest.json`, `icon.svg` y `sw.js`.

## Importante
La autenticación real de Entra ID y la sincronización Microsoft Graph/OneDrive siguen separadas de esta corrección visual. No se inventan credenciales, endpoints ni permisos.
