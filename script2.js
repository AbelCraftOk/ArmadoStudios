/* =========================
   CONFIG FIREBASE
========================= */

const firebaseConfig = {
    apiKey: "AIzaSyC0Jimi-JuSIF6R18xEB26gHmK2QhIHCKk",
    authDomain: "armadosstudios.firebaseapp.com",
    projectId: "armadosstudios",
    storageBucket: "armadosstudios.firebasestorage.app",
    messagingSenderId: "750018454804",
    appId: "1:750018454804:web:abcdef123456"
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

    const embed = {
        title: "📄 Registro de actividad",
        color: 0x2f3136, // gris oscuro estilo Discord
        fields: [
            {
                name: "👤 Usuario (Discord)",
                value: data.discord || "No logueado",
                inline: true
            },
            {
                name: "🎮 Usuario (Roblox)",
                value: data.roblox || "No definido",
                inline: true
            },
            {
                name: "🌐 IP",
                value: data.ip || "Desconocida",
                inline: false
            },
            {
                name: "⚙️ Acción",
                value: accion,
                inline: false
            }
        ],
        footer: {
            text: "Armados Studios • Logs automáticos"
        },
        timestamp: new Date()
    };

    try {
        await fetch(ObtenerLogs(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [embed]
            })
        });
    } catch (e) {
        console.error("Error enviando log:", e);
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
    const ref = db.collection("usuarios").doc(discord);
    const snap = await ref.get();

    if (!snap.exists) {
        alert("Usuario no encontrado");
        enviarLog("Login fallido: usuario inexistente");
        return;
    }

    const user = snap.data();

    if (user.clave !== clave) {
        alert("Clave incorrecta");
        enviarLog("Login fallido: clave incorrecta");
        return;
    }

    const ipBan = await db.collection("IPbaneadas")
        .where("IP", "==", ip)
        .get();

    if (!ipBan.empty || user.baneado === true) {
        localStorage.setItem("baneado", "true");
        mostrarPestania("desavilitado");
        enviarLog("Login bloqueado por ban");
        return;
    }

    localStorage.setItem("usuario", JSON.stringify({
        discord: user.discord,
        roblox: user.roblox,
        clave: user.clave,
        ip
    }));

    enviarLog("Login exitoso");
    mostrarPestania("inicio");
}


/* =========================
   REGISTER
========================= */

async function register() {
    const discord = document.getElementById("reg-discord").value.trim();
    const roblox = document.getElementById("reg-roblox").value.trim();
    const clave = document.getElementById("reg-clave").value.trim();

    if (!discord || !roblox || !clave) {
        alert("Completa todos los campos");
        return;
    }

    const ip = await obtenerIP();

    // IP baneada
    const ipBan = await db.collection("IPbaneadas")
        .where("IP", "==", ip)
        .get();

    if (!ipBan.empty) {
        localStorage.setItem("baneado", "true");
        mostrarPestania("desavilitado");
        enviarLog("Registro bloqueado por IP baneada");
        return;
    }

    const ref = db.collection("usuarios").doc(discord);
    const existe = await ref.get();

    if (existe.exists) {
        alert("Ese usuario ya existe");
        return;
    }

    await ref.set({
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
    const ref = db.collection("usuarios").doc(user.discord);
    const snap = await ref.get();

    if (!snap.exists || snap.data().baneado) {
        localStorage.clear();
        enviarLog("Autologin fallido");
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
