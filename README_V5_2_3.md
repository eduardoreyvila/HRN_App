HRN_APP V5.2.3 — Corrección del error de login "Cannot add property clientIds"

Síntoma: al presionar "Iniciar sesión" aparecía el mensaje
"No se pudo iniciar sesión con Microsoft. Cannot add property clientIds,
object is not extensible".

Causa: `package.json` declaraba `"@azure/msal-browser": "^5.0.0"` sin
`package-lock.json`. Cada build de GitHub Actions instalaba automáticamente
la última versión 5.x publicada (la rama v5 recibe actualizaciones
continuas). MSAL Browser v5 introdujo cambios internos importantes:
- Requiere una página dedicada de "redirect bridge" para manejar los
  popups de login, debido a los nuevos encabezados de seguridad
  Cross-Origin-Opener-Policy (COOP) que Microsoft Entra ID envía por
  defecto.
- Reestructuró cómo arma internamente el objeto de configuración.

El patrón usado en `app.js` (`new PublicClientApplication(config)` seguido
de `await instance.initialize()`) es el correcto para MSAL v2.x a v4.x,
pero ya no es compatible sin cambios adicionales con v5.x — de ahí el
error, que ocurre dentro del propio armado interno de configuración de la
librería, no en el código de la app.

Solución aplicada: se fijó la dependencia a la última versión estable de
la rama v4 (`"@azure/msal-browser": "4.27.0"`, sin `^`, para que no vuelva
a actualizarse solo a una versión mayor sin que sea una decisión
explícita). Con esa versión, el código existente (login/logout, adquisición
de tokens, sincronización con OneDrive) funciona sin cambios.

Si en el futuro se quiere migrar a MSAL v5.x para aprovechar sus mejoras,
hay que implementar antes la página de "redirect bridge" que exige esa
versión (ver la guía oficial de migración v4→v5 de Microsoft).

Recomendación adicional: después de desplegar esta corrección, conviene
que quien probó el login con la versión rota borre los datos del sitio
(cookies/localStorage de `https://<usuario>.github.io`) una vez, ya que
MSAL guarda su caché en `localStorage` (`cacheLocation: "localStorage"`) y
podría haber quedado un estado inconsistente ahí.
