HRN_APP V5.2.2 — Sincronización con OneDrive reforzada

La app ya contaba con inicio de sesión Microsoft (MSAL) y una sincronización
básica hacia OneDrive vía Microsoft Graph. Esta versión corrige y refuerza
esa funcionalidad:

1. **Estructura de carpetas por Cliente/Máquina**: cada caso sincronizado se
   guarda en `HRN_App/{Cliente}/{Máquina}/{Zona}/{Riesgo}_{id}/`, con
   `caso_info.json` (datos completos del caso) y todas sus fotos. Cada
   carpeta identifica sin ambigüedad al Cliente y a la Máquina.
2. **Corrección de codificación de URLs**: nombres de cliente/máquina/zona
   con espacios, tildes o símbolos ya no rompen la subida (antes se
   interpolaban sin `encodeURIComponent` en la URL de Graph).
3. **Creación explícita de carpetas**: en vez de depender del comportamiento
   implícito de la API al subir por ruta, la app ahora crea (o reutiliza si
   ya existen) cada carpeta intermedia antes de subir archivos. Es más
   confiable en OneDrive personal y en OneDrive/SharePoint empresarial.
4. **Soporte de archivos grandes**: la carga simple de Graph sólo admite
   archivos de hasta 4MB. Se agregó una sesión de carga por partes
   (`createUploadSession`) como respaldo automático para fotos que superen
   ese límite.
5. **Sincronización resiliente caso por caso**: si un caso falla (por
   ejemplo, por un corte de red), ya no se aborta toda la sincronización.
   Los demás casos pendientes se siguen procesando y al final se muestra un
   resumen (cuántos casos se sincronizaron y cuáles fallaron, con el motivo).
6. **Feedback de progreso real**: el diálogo de sincronización ahora muestra
   un registro en vivo por caso y por foto ("Sincronizando 2/5 (foto 3/4)…"),
   en lugar de un único `alert()` al final.
7. **Corrección de un bug de UI**: el botón "Sincronizar ahora" estaba
   dentro de un `<form method="dialog">`, por lo que al hacer clic cerraba
   el diálogo inmediatamente mientras la sincronización seguía en segundo
   plano, ocultando el resultado. Ahora es un botón de tipo `button` que no
   cierra el diálogo por sí solo.
8. **Limpieza del repositorio**: se eliminaron `sw.js`, `manifest.json` e
   `icon.svg` duplicados en la raíz del proyecto (versiones desactualizadas
   que Vite nunca usa; los reales viven en `public/` y son los que se
   publican en `dist/`).

Requisitos para que la sincronización funcione en un despliegue propio:
- El *App registration* de Microsoft Entra ID (`clientId`/`authority` en
  `app.js`, dentro de `msalConfig`) debe tener configurado como
  *Redirect URI* (SPA) la URL exacta de despliegue, por ejemplo
  `https://<usuario>.github.io/HRN_App/`.
- El permiso delegado `Files.ReadWrite` de Microsoft Graph debe estar
  autorizado (consentimiento del usuario al iniciar sesión es suficiente
  para OneDrive personal/business).
