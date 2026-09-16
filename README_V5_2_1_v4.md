HRN_APP V5.2.1 — CORREGIDA v4

Correcciones de esta versión:
1. Se conecta explícitamente el botón "Iniciar sesión" con handleLogin().
2. El botón cambia a "Cerrar sesión" cuando existe una cuenta autenticada.
3. MSAL se inicializa antes de loginPopup().
4. Se mantiene la validación real de Microsoft Graph /me.
5. El indicador Online/Offline realiza una comprobación real contra el endpoint público de Microsoft Entra, además de considerar navigator.onLine.
6. El Service Worker está dentro de public/ para que Vite lo publique realmente en dist/.
7. manifest.json e icon.svg también se publican mediante public/.
8. El Service Worker almacena en caché los recursos que se cargan correctamente y permite trabajar offline después de la primera carga.
9. GitHub Actions utiliza npm install y no requiere package-lock.json.
