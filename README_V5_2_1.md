# HRN_APP V5.2.1 — autenticación Entra ID real

Esta corrección conserva la interfaz V5.1 y elimina la dependencia del CDN de MSAL Browser.

## Corrección aplicada
- `@azure/msal-browser` se instala como dependencia npm y queda incluido en el bundle de Vite.
- Se eliminó el `<script>` externo `alcdn.msauth.net`.
- Se agregó `await instance.initialize()` antes de `handleRedirectPromise()` / login, requerido por MSAL Browser moderno.
- La autenticación usa el App Registration existente:
  - Tenant ID: `02b270aa-fb2e-453a-9294-22ea7b6b4df6`
  - Client ID: `641d990c-2d0e-4ee9-9b60-7d202394e0b8`
  - Redirect URI: `https://eduardoreyvila.github.io/HRN_App/`
- Se solicita `openid`, `profile` y `User.Read`.
- Después del login se valida `GET https://graph.microsoft.com/v1.0/me`.
- No se utiliza client secret.

## GitHub Pages
Pages debe estar configurado con **Source: GitHub Actions**.
El workflow construye `dist` y publica ese directorio.

## OneDrive
La escritura/lectura de OneDrive no se activa todavía en V5.2.1. Primero se valida la autenticación y Graph `/me`; luego se implementa `Files.ReadWrite` y OneDrive.


## V5.2.1 v3 — corrección MSAL
Se garantiza que MSAL se asigna a `window.msal` antes de evaluar `app.js` y que `login()` espera la inicialización completa de PublicClientApplication. Esto evita el error `uninitialized_public_client_application`.
