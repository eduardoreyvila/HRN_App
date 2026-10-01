# Relevamiento HRN — V6.0.2 Local

Versión local/offline de la APP HRN. No usa MSAL, Microsoft Graph, OneDrive, cuentas Microsoft ni servicios remotos.

## Almacenamiento

- Índice y datos de trabajo: IndexedDB del dispositivo.
- Evidencias y archivos de proyecto: carpeta local seleccionada por el usuario mediante File System Access API.
- Carpeta objetivo: `08_APP`.
- La APP crea dentro de `08_APP` una carpeta por proyecto: `Cliente_YYYY-MM-DD`.

Estructura:

```text
08_APP/
└── Cliente_YYYY-MM-DD/
    ├── 00_Datos_Proyecto/
    │   ├── proyecto.json
    │   └── Relevamiento_HRN.csv
    ├── 01_Evidencias/
    │   └── Máquina/Zona/Riesgo_ID/fotos.jpg
    └── 02_Datos_Relevados/
        └── Máquina/Zona/Riesgo_ID.json
```

## Importante sobre Android/Windows

Una PWA ejecutada en un navegador no puede escribir arbitrariamente en la raíz del almacenamiento del dispositivo sin permiso explícito del usuario. Por seguridad, la APP muestra un selector de carpetas. El usuario debe seleccionar `08_APP`; si selecciona su carpeta padre, la APP ofrece crear `08_APP` dentro de ella.

La File System Access API requiere un contexto seguro (HTTPS) y un gesto del usuario para abrir el selector. Si el navegador no soporta esta API, la APP sigue funcionando con IndexedDB y exportación CSV, pero no puede crear carpetas físicas automáticamente.

## Funcionalidades heredadas

- Cliente/proyecto
- Máquina/línea
- Límites espaciales / zonas
- Peligro y riesgo asociado
- DPH, LO, FE y NP
- Cálculo HRN = DPH × LO × FE × NP
- Evidencias fotográficas desde cámara/galería
- Edición y eliminación
- Navegación hacia atrás
- Exportación CSV
- PWA instalable
- Trabajo sin conexión


V6.0.2: se recupera el look and feel de V5.3.1, manteniendo almacenamiento local y configuración de 08_APP.


## V6.0.3
- Listados de clientes, máquinas/líneas y zonas ordenados alfabéticamente en español.
- Incorporado logo AVEC en el encabezado en reemplazo del icono HRN.
