import * as msal from '@azure/msal-browser';
import './styles.css';

// Make MSAL available before the legacy V5.1 application code is evaluated.
window.msal = msal;

// The app waits for this import, while app.js itself waits for MSAL initialization
// before allowing loginPopup().
await import('./app.js');
