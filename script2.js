/* =========================
   CONFIG FIREBASE
========================= */

const firebaseConfig = {
    apiKey: "API_KEY_AQUI",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================
   WEBHOOK LOGS
========================= */

function ObtenerLogs() {
    return "https://discord.com/api/webhooks"
        + "/1468120004473126932/"
        + "OExqgqJNhTcDxSa1XqbhTnqmMrFo7hKDJkZbL"
        + "U3LIKk9mUEEKU0lXMvHOiK7pkUof"
        + "G7B";
}

async function enviarLog(accion) {
    const data = JSON.parse(localStorage.getItem("usuario") || "{}");

    const payload = {
        content:
`**Usuario (Discord):** ${data.discord || "N/A"}
**Usuario (Roblox):** ${data.roblox || "N/A"}
**IP:** ${data.ip || "Desconocida"}
**Acción:** ${accion}`
    };

    try {
        await fetch(ObtenerLogs(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error("Error enviando log", e);
    }
}

/* =========================
   OBTENER IP
========================= */

async function obtenerIP() {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
}

/* =========================
   LOGIN
========================= */

async function login() {
    const discord = document.getElementById("login-discord").value.trim();
    const clave = document.getElementById("login-clave").value.trim();

    if (!discord || !clave) {
        alert("Completa todos los campos");
        return;
    }

    const ip = await obtenerIP();

    const snap = await db.collection("usuarios")
        .where("discord", "==", discord)
        .where("clave", "==", clave)
        .get();

    if (snap.empty) {
        alert("Credenciales incorrectas");
        enviarLog("Login fallido");
        return;
    }

    const user = snap.docs[0].data();

    const ipBan = await db.collection("IPbaneadas")
        .where("IP", "==", ip)
        .get();

    if (ipBan.size > 0 || user.baneado === true) {
        localStorage.setItem("baneado", "true");
        mostrarPestania("desavilitado");
        enviarLog("Intento de login baneado");
        return;
    }

    localStorage.setItem("usuario", JSON.stringify({
        discord: user.discord,
        roblox: user.roblox,
        clave: user.clave,
        ip: ip
    }));

    enviarLog("Login exitoso");
    mostrarPestania("inicio");
}

/* =========================
   REGISTER
========================= */

async function register() {
    if (localStorage.getItem("baneado")) {
        mostrarPestania("desavilitado");
        return;
    }

    const discord = document.getElementById("reg-discord").value.trim();
    const roblox = document.getElementById("reg-roblox").value.trim();
    const clave = document.getElementById("reg-clave").value.trim();
    const ip = await obtenerIP();

    const ipBan = await db.collection("IPbaneadas")
        .where("IP", "==", ip)
        .get();

    if (ipBan.size > 0) {
        mostrarPestania("desavilitado");
        enviarLog("Registro bloqueado por IP");
        return;
    }

    await db.collection("usuarios").add({
        discord,
        roblox,
        clave,
        baneado: false,
        ip,
        fecha: new Date()
    });

    localStorage.setItem("usuario", JSON.stringify({
        discord,
        roblox,
        clave,
        ip
    }));

    enviarLog("Registro exitoso");
    mostrarPestania("inicio");
}

/* =========================
   AUTOLOGIN
========================= */

async function autologin() {
    const data = localStorage.getItem("usuario");
    if (!data) return;

    const user = JSON.parse(data);

    const snap = await db.collection("usuarios")
        .where("discord", "==", user.discord)
        .where("clave", "==", user.clave)
        .get();

    if (snap.empty || snap.docs[0].data().baneado) {
        localStorage.clear();
        mostrarPestania("login");
        return;
    }

    mostrarPestania("inicio");
    enviarLog("Autologin exitoso");
}

/* =========================
   BAN / UNBAN
========================= */

async function banUsuario(discord, razon) {
    if (!discord || !razon) {
        alert("Uso: !ban usuario razon");
        return;
    }

    const snap = await db.collection("usuarios")
        .where("discord", "==", discord)
        .get();

    if (snap.empty) {
        alert("Usuario no encontrado");
        return;
    }

    snap.forEach(doc => {
        doc.ref.update({ baneado: true });
    });

    enviarLog(`Usuario baneado: ${discord} | Razón: ${razon}`);
}

async function unbanUsuario(discord, razon) {
    if (!discord || !razon) {
        alert("Uso: !unban usuario razon");
        return;
    }

    const snap = await db.collection("usuarios")
        .where("discord", "==", discord)
        .get();

    snap.forEach(doc => {
        doc.ref.update({ baneado: false });
    });

    enviarLog(`Usuario desbaneado: ${discord} | Razón: ${razon}`);
}
