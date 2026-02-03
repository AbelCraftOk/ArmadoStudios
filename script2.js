// 🔥 CONFIGURACIÓN FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyC0Jimi-JuSIF6R18xEB26gHmK2QhIHCKk",
  authDomain: "armadosstudios.firebaseapp.com",
  projectId: "armadosstudios",
  storageBucket: "armadosstudios.firebasestorage.app",
  messagingSenderId: "750018454804",
  appId: "1:750018454804:web:3cdb44ea4d63cfca050e01"
};

let firebaseListo = false;

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

firebaseListo = true;

function ObtenerLogs() {
    return "https://discord.com/api/webhooks/"
        + "1468120004473126932/"
        + "OExqgqJNhTcDxSa1XqbhTnqmMrFo7hKDJkZbL"
        + "U3LIKk9mUEEKU0lXMvHOiK7pkUofG7B";
}

async function enviarLog(accion) {
    const data = {
        embeds: [{
            title: "Nuevo Log",
            fields: [
                { name: "Usuario (Discord)", value: localStorage.discord || "N/A" },
                { name: "Usuario (Roblox)", value: localStorage.roblox || "N/A" },
                { name: "Acción", value: accion }
            ],
            color: 3447003
        }]
    };

    fetch(ObtenerLogs(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

async function login() {
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }

    const discord = loginDiscord.value.trim();
    const pass = loginPass.value.trim();

    if (!discord || !pass) {
        enviarLog("Login fallido: campos vacíos");
        alert("Completa todos los campos");
        return;
    }

    const q = await db.collection("usuarios")
        .where("discord", "==", discord)
        .get();

    if (q.empty) {
        enviarLog("Login fallido: usuario inexistente (" + discord + ")");
        alert("Usuario no encontrado");
        return;
    }

    const user = q.docs[0].data();

    if (user.clave !== pass) {
        enviarLog("Login fallido: contraseña incorrecta (" + discord + ")");
        alert("Contraseña incorrecta");
        return;
    }

    if (user.baneado) {
        enviarLog("Login bloqueado: usuario baneado (" + discord + ")");
        mostrarPestania("desavilitado");
        return;
    }

    localStorage.discord = user.discord;
    localStorage.roblox = user.roblox;
    localStorage.clave = user.clave;

    enviarLog("Login exitoso");
    mostrarPestania("inicio");
}



async function register() {
    if (localStorage.discord) {
        mostrarPestania("desavilitado");
        return;
    }

    const discord = regDiscord.value.trim();
    const roblox = regRoblox.value.trim();
    const pass = regPass.value.trim();

    if (!discord || !roblox || !pass) {
        alert("Completa todos los campos");
        return;
    }

    // 🔎 Verificar si ya existe
    const existe = await db.collection("usuarios")
        .where("discord", "==", discord)
        .get();

    if (!existe.empty) {
        alert("Ese usuario de Discord ya existe");
        return;
    }

    // ✅ Crear usuario
    await db.collection("usuarios").add({
        discord: discord,
        roblox: roblox,
        clave: pass,
        baneado: false,
        creado: Date.now()
    });

    // 💾 Guardar sesión
    localStorage.discord = discord;
    localStorage.roblox = roblox;
    localStorage.clave = pass;

    enviarLog("Registro exitoso");

    mostrarPestania("inicio");
}


async function autologin() {
    if (!firebaseListo) return;
    if (!localStorage.discord || !localStorage.clave) return;

    mostrarOverlayLogin();
    enviarLog("Intento de autologin");

    const q = await db.collection("usuarios")
        .where("discord", "==", localStorage.discord)
        .get();

    if (q.empty) {
        enviarLog("Autologin fallido: cuenta inexistente");
        localStorage.clear();
        ocultarOverlayLogin();
        return;
    }

    const user = q.docs[0].data();

    if (user.baneado) {
        enviarLog("Autologin bloqueado: usuario baneado");
        ocultarOverlayLogin();
        mostrarPestania("desavilitado");
        return;
    }
    ocultarOverlayLogin();
    enviarLog("Autologin exitoso");
    mostrarPestania("inicio");
}

window.addEventListener("load", () => {
    enviarLog("Apertura de la web desde un dispositivo");
});

window.addEventListener("beforeunload", () => {
    enviarLog("Cierre de pestaña / navegador / dispositivo");
});