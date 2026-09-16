const DB_NAME = "HRN_DB", DB_VERSION = 1;
const hazards = {
  "Mecánico": ["Aplastamiento / Contacto intempestivo", "Atrapamiento / Bloqueo de acceso", "Caída de objetos de manipulación", "Desniveles / Superficies resbaladizas / Obstáculos", "Elementos punzantes / cortantes / enganche / abrasión", "Interacción con equipos móviles", "Proyección de partículas", "Trabajo en altura"],
  "Eléctrico": ["Descarga eléctrica"], "Térmico": ["Alta temp.", "Baja temp.", "Material incandescente"],
  "Presión": ["Tuberías con presión y conexiones", "Fluidos a presión: proyección", "Tanques a presión"],
  "Radiación": ["Gamma", "IRojo", "Ultra V", "X"], "Sustancias peligrosas": ["Biológicas", "Explosivos", "Gases y humos", "Líquidos"],
  "Del ambiente": ["Baja luminosidad", "Calor / Frío", "Hum. excesiva / insuficiente", "Intemperie", "Ruido"],
  "Ergonómico": ["Espacios confinados", "Hiperextensión", "Mov. antinaturales", "Mov. repetitivos", "Vibraciones"],
  "De información": ["Conexionados", "Documentación", "Señalización y dispositivos de alarma"],
  "De funcionamiento": ["Accionamientos / Pulsadores", "Paradas de emergencia", "Puesta en marcha intempestiva"]
};
const DPH = [["0.1", "Rasguño / Moretón"], ["0.5", "Quemadura / Corte / Enfermedad corto plazo"], ["1", "Rotura menor de hueso de dedo, mano o pie"], ["2", "Rotura mayor de hueso de dedo, mano o pie"], ["4", "Pérdida de 1 o 2 dedos"], ["8", "Amputación pierna / mano. Pérdida auditiva o visual parcial"], ["15", "Muerte"]];
const LO = [["0.03", "Imposible. No puede pasar bajo ninguna circunstancia"], ["0.1", "Casi improbable. Sólo es posible bajo circunstancias extremas."], ["0.5", "Es muy improbable. Aunque concebible"], ["1", "Improbable. Pero podría ocurrir"], ["2", "Posible. Pero inusual"], ["5", "Hay posibilidades. Puede pasar"], ["8", "Probable. No sorpresivo"], ["10", "Probablemente. Se puede esperar que ocurra"], ["15", "Cierto. Indudable"]];
const FE = [["0.1", "Infrecuentemente"], ["0.2", "Anualmente"], ["1", "Mensualmente"], ["1.5", "Semanalmente"], ["2.5", "Diario"], ["4", "Por hora"], ["5", "En cada ciclo. Constante"]];
const NP = [["1", "De 1 a 2"], ["2", "De 3 a 7"], ["4", "De 8 a 15"], ["8", "De 16 a 50"], ["12", "Más de 50"]];

let db, state = { client: null, machine: null, zone: null, assessment: null, photos: [] };
const $ = s => document.querySelector(s), uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2);
const stores = ["clients", "machines", "zones", "assessments", "photos", "settings"];

function openDB() { return new Promise((resolve, reject) => { const r = indexedDB.open(DB_NAME, DB_VERSION); r.onupgradeneeded = () => { db = r.result; for (const s of stores) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" }) }; r.onsuccess = () => { db = r.result; resolve(db) }; r.onerror = () => reject(r.error) }) }
function tx(s, m = "readonly") { return db.transaction(s, m).objectStore(s) }
function put(s, o) { return new Promise((a, b) => { const r = tx(s, "readwrite").put(o); r.onsuccess = () => a(o); r.onerror = () => b(r.error) }) }
function del(s, id) { return new Promise((a, b) => { const r = tx(s, "readwrite").delete(id); r.onsuccess = () => a(); r.onerror = () => b(r.error) }) }
function all(s) { return new Promise((a, b) => { const r = tx(s).getAll(); r.onsuccess = () => a(r.result); r.onerror = () => b(r.error) }) }
function get(s, id) { return new Promise((a, b) => { const r = tx(s).get(id); r.onsuccess = () => a(r.result); r.onerror = () => b(r.error) }) }

function setView(n) { document.querySelectorAll(".view").forEach(v => v.classList.add("hidden")); $("#view" + n).classList.remove("hidden") }
function breadcrumb() { const a = ["Clientes"]; if (state.client) a.push(state.client.name); if (state.machine) a.push(state.machine.name); if (state.zone) a.push(state.zone.name); $("#breadcrumbs").textContent = a.join(" › ") }
function card(h) { return `<article class="card">${h}</article>` }

async function renderClients() { state = { client: null, machine: null, zone: null, assessment: null, photos: [] }; breadcrumb(); setView("Clients"); const xs = await all("clients"); $("#clientsList").innerHTML = xs.length ? xs.map(c => card(`<span class="tag">${esc(c.industry)}</span><h3>${esc(c.name)}</h3><p>Planta: ${esc(c.plant)}</p><div class="card-actions"><button onclick="selectClient('${c.id}')">Abrir</button><button class="secondary" onclick="editClient('${c.id}')">Editar</button><button class="secondary" onclick="removeItem('clients','${c.id}')">Eliminar</button></div>`)).join("") : `<div class="empty">No hay clientes cargados.</div>` }
async function renderMachines() { breadcrumb(); setView("Machines"); $("#machinesTitle").textContent = `Máquinas / líneas — ${state.client.name}`; const xs = (await all("machines")).filter(x => x.clientId === state.client.id); $("#machinesList").innerHTML = xs.length ? xs.map(m => card(`<h3>${esc(m.name)}</h3><p>${esc(m.description || "")}</p><div class="card-actions"><button onclick="selectMachine('${m.id}')">Abrir</button><button class="secondary" onclick="editMachine('${m.id}')">Editar</button><button class="secondary" onclick="removeItem('machines','${m.id}')">Eliminar</button></div>`)).join("") : `<div class="empty">No hay máquinas o líneas cargadas.</div>` }
async function renderZones() { breadcrumb(); setView("Zones"); $("#zonesTitle").textContent = `Zonas — ${state.machine.name}`; const xs = (await all("zones")).filter(x => x.machineId === state.machine.id); $("#zonesList").innerHTML = xs.length ? xs.map(z => card(`<h3>${esc(z.name)}</h3><p>${esc(z.description || "")}</p><div class="card-actions"><button onclick="selectZone('${z.id}')">Abrir</button><button class="secondary" onclick="editZone('${z.id}')">Editar</button><button class="secondary" onclick="removeItem('zones','${z.id}')">Eliminar</button></div>`)).join("") : `<div class="empty">No hay límites espaciales cargados.</div>` }
async function renderAssessments() { breadcrumb(); setView("Assessments"); $("#assessmentsTitle").textContent = `Peligros y riesgos — ${state.zone.name}`; const xs = (await all("assessments")).filter(x => x.zoneId === state.zone.id); $("#assessmentsList").innerHTML = xs.length ? xs.map(a => card(`<span class="tag">${esc(a.hazardType)}</span><h3>${esc(a.risk)}</h3><div class="risk-card"><div class="hrn">HRN ${num(a.hrn)}</div></div><p>Fotos: ${a.photoCount || 0} · ${a.synced ? "Sincronizado" : "Pendiente"}</p><div class="card-actions"><button onclick="editAssessment('${a.id}')">Abrir / Editar</button><button class="secondary" onclick="removeAssessment('${a.id}')">Eliminar</button></div>`)).join("") : `<div class="empty">No hay análisis para esta zona.</div>`; updatePending() }

function fillSelect(el, arr) { el.innerHTML = arr.map(x => `<option value="${x[0]}">${x[0]} — ${esc(x[1])}</option>`).join("") }
function setupAssessmentForm(a = {}) { $("#hazardType").innerHTML = Object.keys(hazards).map(x => `<option>${esc(x)}</option>`).join(""); fillSelect($("#dph"), DPH); fillSelect($("#lo"), LO); fillSelect($("#fe"), FE); fillSelect($("#np"), NP); $("#hazardType").value = a.hazardType || Object.keys(hazards)[0]; populateRisks(a.risk); $("#dph").value = a.dph ?? "0.1"; $("#lo").value = a.lo ?? "0.03"; $("#fe").value = a.fe ?? "0.1"; $("#np").value = a.np ?? "1"; $("#notes").value = a.notes || ""; $("#assessmentId").value = a.id || ""; state.photos = []; calcHRN(); renderPhotos() }
function populateRisks(sel) { const h = $("#hazardType").value; $("#risk").innerHTML = hazards[h].map(x => `<option>${esc(x)}</option>`).join(""); if (sel) $("#risk").value = sel }
async function renderPhotos() { const ps = state.assessment ? await all("photos") : state.photos; const f = state.assessment ? ps.filter(p => p.assessmentId === state.assessment.id) : state.photos; $("#photoGrid").innerHTML = f.map(p => `<div class="photo"><img src="${p.dataUrl}" alt="Evidencia"><button type="button" onclick="removePhoto('${p.id}')">×</button></div>`).join("") }
function calcHRN() { const v = ["#dph", "#lo", "#fe", "#np"].map(s => Number($(s).value || 0)); $("#hrnValue").textContent = num(v.reduce((a, b) => a * b, 1)) }
function num(n) { return Number.isInteger(Number(n)) ? String(n) : Number(n).toFixed(2).replace(/0+$/, "").replace(/\.$/, "") }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])) }

function sanitizePath(s) { return String(s || "").replace(/[/\\?%*:|"<>]/g, "_").trim(); }

function openClientForm(c = {}) { $("#clientName").value = c.name || ""; $("#industryType").value = c.industry || ""; $("#plantName").value = c.plant || ""; $("#clientDialog").dataset.editId = c.id || ""; $("#clientDialog").showModal() }
function openMachineForm(m = {}) { $("#machineName").value = m.name || ""; $("#machineDescription").value = m.description || ""; $("#machineDialog").dataset.editId = m.id || ""; $("#machineDialog").showModal() }
function openZoneForm(z = {}) { $("#zoneName").value = z.name || ""; $("#zoneDescription").value = z.description || ""; $("#zoneDialog").dataset.editId = z.id || ""; $("#zoneDialog").showModal() }

window.selectClient = async id => { state.client = await get("clients", id); state.machine = null; state.zone = null; renderMachines() }
window.selectMachine = async id => { state.machine = await get("machines", id); state.zone = null; renderZones() }
window.selectZone = async id => { state.zone = await get("zones", id); renderAssessments() }
window.editClient = async id => openClientForm(await get("clients", id));
window.editMachine = async id => openMachineForm(await get("machines", id));
window.editZone = async id => openZoneForm(await get("zones", id));
window.editAssessment = async id => { const a = await get("assessments", id); state.assessment = a; setView("Assessment"); breadcrumb(); $("#assessmentTitle").textContent = "Editar análisis HRN"; setupAssessmentForm(a) }
window.removeItem = async (s, id) => { if (confirm("¿Eliminar registro?")) { await del(s, id); if (s === "clients") renderClients(); else if (s === "machines") renderMachines(); else renderZones() } }
window.removeAssessment = async id => { if (!confirm("¿Eliminar análisis y sus fotos?")) return; for (const p of (await all("photos")).filter(p => p.assessmentId === id)) await del("photos", p.id); await del("assessments", id); renderAssessments() }
window.removePhoto = async id => { await del("photos", id); renderPhotos() }

$("#newClientBtn").onclick = () => openClientForm();
$("#clientForm").onsubmit = async e => { e.preventDefault(); const id = $("#clientDialog").dataset.editId || uid(); await put("clients", { id, name: $("#clientName").value.trim(), industry: $("#industryType").value.trim(), plant: $("#plantName").value.trim(), updatedAt: new Date().toISOString() }); e.target.closest("dialog").close(); e.target.reset(); $("#clientDialog").dataset.editId = ""; renderClients() }
$("#newMachineBtn").onclick = () => openMachineForm();
$("#machineForm").onsubmit = async e => { e.preventDefault(); const id = $("#machineDialog").dataset.editId || uid(); await put("machines", { id, clientId: state.client.id, name: $("#machineName").value.trim(), description: $("#machineDescription").value.trim(), updatedAt: new Date().toISOString() }); e.target.closest("dialog").close(); e.target.reset(); $("#machineDialog").dataset.editId = ""; renderMachines() }
$("#newZoneBtn").onclick = () => openZoneForm();
$("#zoneForm").onsubmit = async e => { e.preventDefault(); const id = $("#zoneDialog").dataset.editId || uid(); await put("zones", { id, machineId: state.machine.id, name: $("#zoneName").value.trim(), description: $("#zoneDescription").value.trim(), updatedAt: new Date().toISOString() }); e.target.closest("dialog").close(); e.target.reset(); $("#zoneDialog").dataset.editId = ""; renderZones() }
$("#newAssessmentBtn").onclick = () => { state.assessment = null; setView("Assessment"); breadcrumb(); $("#assessmentTitle").textContent = "Nuevo análisis HRN"; setupAssessmentForm() }
$("#cancelAssessmentBtn").onclick = () => renderAssessments();
$("#backAssessmentBtn").onclick = () => renderAssessments();
$("#backAssessmentsBtn").onclick = () => renderZones();
$("#backZonesBtn").onclick = () => renderMachines();
$("#backMachinesBtn").onclick = () => renderClients();
$("#hazardType").onchange = () => populateRisks();
["#dph", "#lo", "#fe", "#np"].forEach(s => $(s).onchange = calcHRN);

$("#photoInput").onchange = async e => {
  for (const file of [...e.target.files]) {
    const dataUrl = await resizeImage(file, 1600);
    const p = { id: uid(), assessmentId: $("#assessmentId").value || "draft", dataUrl, name: file.name, mime: file.type, createdAt: new Date().toISOString() };
    state.photos.push(p);
    await put("photos", p)
  }
  renderPhotos();
  e.target.value = ""
}

function resizeImage(file, max) { return new Promise(resolve => { const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, max / img.width); const c = document.createElement("canvas"); c.width = img.width * scale; c.height = img.height * scale; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/jpeg", .82)) }; img.src = r.result }; r.readAsDataURL(file) }) }

$("#assessmentForm").onsubmit = async e => {
  e.preventDefault();
  const id = $("#assessmentId").value || uid();
  const a = { id, zoneId: state.zone.id, hazardType: $("#hazardType").value, risk: $("#risk").value, dph: Number($("#dph").value), lo: Number($("#lo").value), fe: Number($("#fe").value), np: Number($("#np").value), hrn: Number($("#hrnValue").textContent), notes: $("#notes").value, photoCount: (await all("photos")).filter(p => p.assessmentId === id).length, updatedAt: new Date().toISOString(), synced: false };
  for (const p of state.photos.filter(p => p.assessmentId === "draft")) { p.assessmentId = id; await put("photos", p) }
  a.photoCount = (await all("photos")).filter(p => p.assessmentId === id).length;
  await put("assessments", a);
  state.assessment = a;
  state.photos = [];
  renderAssessments()
}

async function projectData() { const [clients, machines, zones, assessments, photos] = await Promise.all(stores.slice(0, 5).map(all)); return { version: 5, exportedAt: new Date().toISOString(), clients, machines, zones, assessments, photos } }
function downloadBlob(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000) }
function csvExport(data) { const rows = [["Cliente", "Industria", "Planta", "Máquina/Línea", "Zona", "Tipo de peligro", "Riesgo", "DPH", "LO", "FE", "NP", "HRN", "Observaciones", "Fotos", "Actualizado"]]; const cs = Object.fromEntries(data.clients.map(x => [x.id, x])), ms = Object.fromEntries(data.machines.map(x => [x.id, x])), zs = Object.fromEntries(data.zones.map(x => [x.id, x])); for (const a of data.assessments) { const z = zs[a.zoneId] || {}, m = ms[z.machineId] || {}, c = cs[m.clientId] || {}; rows.push([c.name, c.industry, c.plant, m.name, z.name, a.hazardType, a.risk, a.dph, a.lo, a.fe, a.np, a.hrn, a.notes, a.photoCount, a.updatedAt]) } return rows.map(r => r.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(";")).join("\n") }
$("#exportBtn").onclick = async () => downloadBlob(new Blob(["\ufeff" + csvExport(await projectData())], { type: "text/csv;charset=utf-8" }), "Relevamiento_HRN.csv");

let connectionTimer = null;
async function connection() {
  let on = navigator.onLine;
  if (on) {
    try {
      await fetch("https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration", { method: "GET", mode: "no-cors", cache: "no-store" });
      on = true;
    } catch (_) { on = false; }
  }
  $("#connectionStatus").textContent = on ? "Online" : "Offline";
  $("#connectionStatus").style.color = on ? "#b9f6ca" : "#ffd3d3";
  const dot = document.querySelector(".status-dot");
  if (dot) dot.style.color = on ? "#5ee6a8" : "#ffcf70";
  return on;
}
window.addEventListener("online", connection);
window.addEventListener("offline", connection);
function startConnectionMonitor() { connection(); if (connectionTimer) clearInterval(connectionTimer); connectionTimer = setInterval(connection, 15000); }

let deferredInstall; window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; $("#installBtn").classList.remove("hidden") }); $("#installBtn").onclick = async () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null } };
async function updatePending() { const n = (await all("assessments")).filter(a => !a.synced).length; $("#pendingCount").textContent = "Pendientes: " + n }

// Configuración MSAL y Scopes actualizadas para Microsoft Graph / OneDrive
let msalInstance;
const msalConfig = {
  auth: {
    clientId: "641d990c-2d0e-4ee9-9b60-7d202394e0b8",
    authority: "https://login.microsoftonline.com/02b270aa-fb2e-453a-9294-22ea7b6b4df6",
    redirectUri: window.location.origin + "/HRN_App/"
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false }
};
const loginRequest = { scopes: ["openid", "profile", "User.Read", "Files.ReadWrite"] };
let authReady = null;

function ensureMsal() {
  if (!window.msal) throw new Error("MSAL Browser no está disponible.");
  if (!msalInstance) {
    // Clonamos la configuración para evitar que el objeto inmutable lance 'object is not extensible'
    const cleanConfig = JSON.parse(JSON.stringify(msalConfig));
    msalInstance = new window.msal.PublicClientApplication(cleanConfig);
  }
  return msalInstance;
}

async function initAuth() {
  if (authReady) return authReady;
  authReady = (async () => {
    const instance = ensureMsal();
    await instance.initialize();
    const redirectResult = await instance.handleRedirectPromise();
    if (redirectResult?.account) instance.setActiveAccount(redirectResult.account);
    if (!instance.getActiveAccount()) {
      const accounts = instance.getAllAccounts();
      if (accounts.length) instance.setActiveAccount(accounts[0]);
    }
    return instance.getActiveAccount();
  })();
  try { return await authReady; } catch (e) { authReady = null; throw e; }
}

async function getAccessToken() {
  const instance = await initAuth().then(() => ensureMsal());
  const account = instance.getActiveAccount();
  if (!account) throw new Error("Debe iniciar sesión para sincronizar con OneDrive.");
  
  const request = { scopes: ["Files.ReadWrite"], account };
  try {
    const res = await instance.acquireTokenSilent({ ...request });
    return res.accessToken;
  } catch (_) {
    const res = await instance.acquireTokenPopup({ ...request });
    return res.accessToken;
  }
}

async function login() {
  const instance = await initAuth().then(() => ensureMsal());
  // Se pasa una copia limpia de loginRequest
  const result = await instance.loginPopup({ ...loginRequest });
  if (result?.account) instance.setActiveAccount(result.account);
  return result;
}

async function logout() {
  const instance = await initAuth().then(() => ensureMsal());
  return instance.logoutPopup({ account: instance.getActiveAccount() || undefined, postLogoutRedirectUri: window.location.origin + "/HRN_App/" });
}

async function getGraphMe() {
  const instance = await initAuth().then(() => ensureMsal());
  const account = instance.getActiveAccount();
  if (!account) throw new Error("No hay una cuenta de Microsoft autenticada.");
  const token = await instance.acquireTokenSilent({ scopes: ["User.Read"], account });
  const response = await fetch("https://graph.microsoft.com/v1.0/me", { headers: { Authorization: `Bearer ${token.accessToken}` } });
  if (!response.ok) throw new Error(`Microsoft Graph respondió ${response.status}`);
  return response.json();
}

async function refreshAuthState() {
  const instance = ensureMsal();
  const account = instance.getActiveAccount();
  $("#authState").textContent = account ? `Autenticado: ${account.username || account.name || "Microsoft"}` : "No autenticado";
  $("#loginBtn").textContent = account ? "Cerrar sesión" : "Iniciar sesión";
  $("#loginBtn").dataset.authenticated = account ? "true" : "false";
}

async function handleLogin() {
  try {
    $("#loginBtn").disabled = true; $("#loginBtn").textContent = "Conectando…";
    const result = await login();
    await refreshAuthState();
  } catch (err) {
    console.error("Error de inicio de sesión:", err);
    alert("No se pudo iniciar sesión con Microsoft.\n\n" + (err?.message || err));
  } finally { $("#loginBtn").disabled = false; }
}

async function handleLogout() {
  try { await logout() } catch (err) { console.warn("Cierre de sesión:", err) }
  await refreshAuthState();
}

$("#loginBtn").onclick = async () => {
  const authenticated = $("#loginBtn").dataset.authenticated === "true";
  if (authenticated) await handleLogout();
  else await handleLogin();
};

// Conversión de Base64 DataURL a ArrayBuffer binario para Microsoft Graph
function dataUrlToArrayBuffer(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Codifica cada segmento de una ruta ("Cliente/Máquina/Zona") para uso seguro en URLs de Graph,
// preservando las barras como separadores de carpeta.
function encodePath(path) {
  return String(path).split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0/me/drive";
const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024; // Límite de la API de carga simple de Graph
const UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024; // Múltiplo de 320 KiB, recomendado por Graph

function syncLog(msg, cls) {
  const el = $("#syncLog");
  el.classList.remove("hidden");
  const p = document.createElement("p");
  if (cls) p.className = cls;
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}
function clearSyncLog() { const el = $("#syncLog"); el.innerHTML = ""; el.classList.add("hidden"); }

// Crea (si no existen) todas las carpetas intermedias de una ruta en OneDrive,
// una por una, de forma idempotente. No depende de que Graph cree la ruta implícitamente.
async function ensureFolderPath(token, path) {
  const segments = String(path).split("/").filter(Boolean);
  let builtPath = "";
  for (const seg of segments) {
    const parentPath = builtPath;
    builtPath = parentPath ? `${parentPath}/${seg}` : seg;

    const checkUrl = `${GRAPH_ROOT}/root:/${encodePath(builtPath)}`;
    const checkRes = await fetch(checkUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (checkRes.ok) continue; // La carpeta ya existe
    if (checkRes.status !== 404) throw new Error(`No se pudo verificar la carpeta "${builtPath}" (HTTP ${checkRes.status})`);

    const createUrl = parentPath
      ? `${GRAPH_ROOT}/root:/${encodePath(parentPath)}:/children`
      : `${GRAPH_ROOT}/root/children`;
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: seg, folder: {}, "@microsoft.graph.conflictBehavior": "fail" })
    });
    // 409 = ya la creó otra pestaña/proceso en paralelo justo ahora: no es un error real.
    if (!createRes.ok && createRes.status !== 409) {
      throw new Error(`No se pudo crear la carpeta "${builtPath}" (HTTP ${createRes.status})`);
    }
  }
}

// Sube un archivo a OneDrive dentro de folderPath. Usa carga simple para archivos pequeños
// y sesión de carga por partes (Graph exige esto para archivos mayores a 4MB).
async function uploadFileToOneDrive(token, folderPath, fileName, arrayBuffer, contentType, onProgress) {
  const size = arrayBuffer.byteLength;
  const encodedTarget = `${encodePath(folderPath)}/${encodeURIComponent(fileName)}`;

  if (size <= SIMPLE_UPLOAD_LIMIT) {
    const res = await fetch(`${GRAPH_ROOT}/root:/${encodedTarget}:/content`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType || "application/octet-stream" },
      body: arrayBuffer
    });
    if (!res.ok) throw new Error(`Error subiendo "${fileName}" (HTTP ${res.status})`);
    return;
  }

  // Archivo grande: sesión de carga por partes.
  const sessionRes = await fetch(`${GRAPH_ROOT}/root:/${encodedTarget}:/createUploadSession`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "replace" } })
  });
  if (!sessionRes.ok) throw new Error(`No se pudo iniciar la carga de "${fileName}" (HTTP ${sessionRes.status})`);
  const { uploadUrl } = await sessionRes.json();

  let offset = 0;
  while (offset < size) {
    const end = Math.min(offset + UPLOAD_CHUNK_SIZE, size);
    const chunk = arrayBuffer.slice(offset, end);
    const chunkRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${offset}-${end - 1}/${size}`
      },
      body: chunk
    });
    if (!chunkRes.ok && chunkRes.status !== 202) {
      throw new Error(`Error subiendo parte de "${fileName}" (HTTP ${chunkRes.status})`);
    }
    offset = end;
    if (onProgress) onProgress(offset / size);
  }
}

// Sincronización real con OneDrive: crea una carpeta por Cliente y, dentro de ella,
// una carpeta por Máquina (y sub-carpetas por Zona/Riesgo para no mezclar evidencias),
// subiendo el JSON del caso y todas sus fotos. Resiliente: si un caso falla, no aborta
// la sincronización de los demás; al final se informa un resumen.
async function syncToOneDrive() {
  const btn = $("#doGraphSync");
  const closeBtn = $("#closeSyncBtn");
  btn.disabled = true;
  closeBtn.disabled = true;
  clearSyncLog();

  let token;
  try {
    token = await getAccessToken();
  } catch (err) {
    syncLog("No se pudo obtener acceso a OneDrive: " + (err.message || err), "err");
    btn.disabled = false;
    closeBtn.disabled = false;
    return;
  }

  const data = await projectData();
  const unsyncedAssessments = data.assessments.filter(a => !a.synced);

  if (unsyncedAssessments.length === 0) {
    syncLog("No hay casos pendientes de sincronizar.");
    btn.disabled = false;
    closeBtn.disabled = false;
    return;
  }

  const cs = Object.fromEntries(data.clients.map(x => [x.id, x]));
  const ms = Object.fromEntries(data.machines.map(x => [x.id, x]));
  const zs = Object.fromEntries(data.zones.map(x => [x.id, x]));

  let okCount = 0, failCount = 0;
  const total = unsyncedAssessments.length;

  for (let idx = 0; idx < total; idx++) {
    const assessment = unsyncedAssessments[idx];
    const zone = zs[assessment.zoneId] || { name: "Zona_Desconocida", machineId: "" };
    const machine = ms[zone.machineId] || { name: "Maquina_Desconocida", clientId: "" };
    const client = cs[machine.clientId] || { name: "Cliente_Desconocido" };
    const caseLabel = `${client.name} / ${machine.name} — ${assessment.risk}`;

    btn.textContent = `Sincronizando ${idx + 1}/${total}…`;
    syncLog(`⏳ Caso ${idx + 1}/${total}: ${caseLabel}`);

    // Carpeta por Cliente > Máquina > Zona > Riesgo_ID, así cada carpeta identifica
    // inequívocamente al Cliente y a la Máquina, y las evidencias de cada caso no se mezclan.
    const folderPath = `HRN_App/${sanitizePath(client.name)}/${sanitizePath(machine.name)}/${sanitizePath(zone.name)}/${sanitizePath(assessment.risk)}_${assessment.id}`;

    try {
      await ensureFolderPath(token, folderPath);

      // 1. Archivo con los datos completos del caso en JSON
      const jsonContent = JSON.stringify({ client, machine, zone, assessment }, null, 2);
      const jsonBuffer = new TextEncoder().encode(jsonContent).buffer;
      await uploadFileToOneDrive(token, folderPath, "caso_info.json", jsonBuffer, "application/json");

      // 2. Evidencias fotográficas asociadas al caso
      const casePhotos = data.photos.filter(p => p.assessmentId === assessment.id);
      for (let i = 0; i < casePhotos.length; i++) {
        const photo = casePhotos[i];
        const photoBuffer = dataUrlToArrayBuffer(photo.dataUrl);
        const fileName = photo.name ? sanitizePath(photo.name) : `evidencia_${i + 1}.jpg`;
        btn.textContent = `Sincronizando ${idx + 1}/${total} (foto ${i + 1}/${casePhotos.length})…`;
        await uploadFileToOneDrive(token, folderPath, fileName, photoBuffer, photo.mime || "image/jpeg");
      }

      // 3. Actualizar estado local a sincronizado
      assessment.synced = true;
      await put("assessments", assessment);
      okCount++;
      syncLog(`✔ ${caseLabel} — ${casePhotos.length} foto(s) subida(s) a ${folderPath}`, "ok");
    } catch (err) {
      failCount++;
      console.error("Error al sincronizar caso:", assessment.id, err);
      syncLog(`✘ ${caseLabel}: ${err.message || err}`, "err");
      // Continuamos con los demás casos en vez de abortar toda la sincronización.
    }
  }

  syncLog(`Resumen: ${okCount} caso(s) sincronizado(s), ${failCount} con error.`, failCount ? "err" : "ok");
  btn.disabled = false;
  closeBtn.disabled = false;
  btn.textContent = "Sincronizar ahora";
  await renderAssessments();
  await updatePending();
}

$("#syncBtn").onclick = () => { clearSyncLog(); $("#syncDialog").showModal(); };
$("#closeSyncBtn").onclick = () => $("#syncDialog").close();
$("#doGraphSync").onclick = () => syncToOneDrive();

(async () => {
  await openDB();
  startConnectionMonitor();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/HRN_App/sw.js", { scope: "/HRN_App/" }).catch(e => console.warn("Service Worker:", e));
  try { await initAuth(); } catch (e) { console.error("MSAL initialization error", e) }
  await refreshAuthState();
  await renderClients();
  await updatePending();
})();