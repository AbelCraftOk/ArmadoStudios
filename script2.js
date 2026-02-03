// 🔥 CONFIGURACIÓN FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyC0Jimi-JuSIF6R18xEB26gHmK2QhIHCKk",
  authDomain: "armadosstudios.firebaseapp.com",
  projectId: "armadosstudios",
  storageBucket: "armadosstudios.firebasestorage.app",
  messagingSenderId: "750018454804",
  appId: "1:750018454804:web:3cdb44ea4d63cfca050e01"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
    const discord = loginDiscord.value;
    const pass = loginPass.value;

    const q = await db.collection("usuarios")
        .where("discord", "==", discord)
        .where("clave", "==", pass)
        .get();

    if (q.empty) return alert("Datos incorrectos");

    const user = q.docs[0].data();
    if (user.baneado) return mostrarPestania("desavilitado");

    localStorage.discord = user.discord;
    localStorage.roblox = user.roblox;
    localStorage.clave = pass;

    enviarLog("Login exitoso");
    mostrarPestania("inicio");
}

async function register() {
    if (localStorage.discord) return mostrarPestania("desavilitado");

    await db.collection("usuarios").add({
        discord: regDiscord.value,
        roblox: regRoblox.value,
        clave: regPass.value,
        baneado: false
    });

    enviarLog("Registro nuevo");
    login();
}

async function autologin() {
    if (!localStorage.discord) return;

    const q = await db.collection("usuarios")
        .where("discord", "==", localStorage.discord)
        .where("clave", "==", localStorage.clave)
        .get();

    if (q.empty) return localStorage.clear();

    mostrarPestania("inicio");
}
