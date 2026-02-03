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

// ✅ VERIFICAR SI EL USUARIO ES ADMINISTRADOR
async function esAdmin(discordUser) {
    if (!discordUser) {
        console.log("esAdmin: No se proporcionó usuario");
        return false;
    }
    
    try {
        console.log("🔍 Verificando admin para:", discordUser);
        
        // Buscar por ID del documento
        const adminDoc = await db.collection("admins")
            .doc(discordUser)
            .get();
        
        if (adminDoc.exists) {
            const data = adminDoc.data();
            console.log("✅ Encontrado por ID. Datos:", data);
            console.log("✅ Valor de perms:", data.perms, "| Tipo:", typeof data.perms);
            const resultado = data.perms === true;
            console.log("✅ Es admin:", resultado);
            return resultado;
        }
        
        console.log("❌ No encontrado como admin");
        return false;
        
    } catch (error) {
        console.error("❌ Error verificando admin:", error);
        return false;
    }
}

// 🔍 FUNCIÓN DE DEBUG
async function verificarMisPermisos() {
    console.log("=== VERIFICANDO PERMISOS ===");
    console.log("Usuario en localStorage:", localStorage.discord);
    
    if (!localStorage.discord) {
        alert("❌ No hay sesión iniciada");
        return;
    }
    
    try {
        const adminDoc = await db.collection("admins")
            .doc(localStorage.discord)
            .get();
        
        if (adminDoc.exists) {
            const data = adminDoc.data();
            console.log("✅ Datos:", data);
            alert(`✅ Encontrado en admins!\n\nUsuario: ${localStorage.discord}\nPerms: ${data.perms}\nTipo: ${typeof data.perms}\nEs admin: ${data.perms === true}`);
        } else {
            alert(`❌ NO encontrado en admins\n\nUsuario buscado: ${localStorage.discord}`);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + error.message);
    }
}

// 🔨 COMANDO !BAN
async function banearUsuario(targetDiscord, razon) {
    console.log("🔨 Ejecutando BAN...");
    console.log("Target:", targetDiscord);
    console.log("Razón:", razon);
    console.log("Usuario actual:", localStorage.discord);
    
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }

    // Verificar permisos
    console.log("Verificando permisos...");
    const isAdmin = await esAdmin(localStorage.discord);
    console.log("¿Es admin?", isAdmin);
    
    if (!isAdmin) {
        alert("❌ No tienes permisos de administrador");
        enviarLog("Intento de ban sin permisos - Target: " + targetDiscord);
        return;
    }

    if (!targetDiscord || !razon) {
        alert("Uso: !ban (usuario) (razón)");
        return;
    }

    try {
        console.log("Buscando usuario:", targetDiscord);
        const q = await db.collection("usuarios")
            .where("discord", "==", targetDiscord)
            .get();

        if (q.empty) {
            alert("Usuario no encontrado: " + targetDiscord);
            return;
        }

        const docId = q.docs[0].id;
        console.log("Usuario encontrado, ID:", docId);

        await db.collection("usuarios").doc(docId).update({
            baneado: true
        });

        const logMsg = `Usuario BANEADO: ${targetDiscord} | Razón: ${razon} | Admin: ${localStorage.discord}`;
        enviarLog(logMsg);
        alert("✅ Usuario " + targetDiscord + " ha sido BANEADO");
        console.log("✅ Ban exitoso");
    } catch (error) {
        console.error("Error al banear:", error);
        alert("Error: " + error.message);
    }
}

// 🔓 COMANDO !UNBAN
async function desbanearUsuario(targetDiscord, razon) {
    console.log("🔓 Ejecutando UNBAN...");
    console.log("Target:", targetDiscord);
    console.log("Razón:", razon);
    
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }

    const isAdmin = await esAdmin(localStorage.discord);
    console.log("¿Es admin?", isAdmin);
    
    if (!isAdmin) {
        alert("❌ No tienes permisos de administrador");
        enviarLog("Intento de unban sin permisos - Target: " + targetDiscord);
        return;
    }

    if (!targetDiscord || !razon) {
        alert("Uso: !unban (usuario) (razón)");
        return;
    }

    try {
        const q = await db.collection("usuarios")
            .where("discord", "==", targetDiscord)
            .get();

        if (q.empty) {
            alert("Usuario no encontrado: " + targetDiscord);
            return;
        }

        const docId = q.docs[0].id;

        await db.collection("usuarios").doc(docId).update({
            baneado: false
        });

        const logMsg = `Usuario DESBANEADO: ${targetDiscord} | Razón: ${razon} | Admin: ${localStorage.discord}`;
        enviarLog(logMsg);
        alert("✅ Usuario " + targetDiscord + " ha sido DESBANEADO");
        console.log("✅ Unban exitoso");
    } catch (error) {
        console.error("Error al desbanear:", error);
        alert("Error: " + error.message);
    }
}

// 💬 PROCESAR COMANDOS
async function procesarComando(mensaje) {
    console.log("📝 Comando recibido:", mensaje);
    
    mensaje = mensaje.trim();
    
    if (!mensaje.startsWith("!")) {
        alert("Los comandos deben empezar con !");
        return;
    }

    const partes = mensaje.split(" ");
    const comando = partes[0].toLowerCase();
    
    console.log("Comando parseado:", comando);
    console.log("Partes:", partes);

    // !verificar NO requiere permisos
    if (comando === "!verificar" || comando === "!check") {
        console.log("Ejecutando verificar...");
        await verificarMisPermisos();
        return;
    }

    // Comandos que requieren permisos
    if (comando === "!ban") {
        const targetUser = partes[1];
        const razon = partes.slice(2).join(" ");
        console.log("Llamando a banearUsuario...");
        await banearUsuario(targetUser, razon);
    } 
    else if (comando === "!unban") {
        const targetUser = partes[1];
        const razon = partes.slice(2).join(" ");
        console.log("Llamando a desbanearUsuario...");
        await desbanearUsuario(targetUser, razon);
    }
    else {
        alert("❌ Comando no reconocido\n\nDisponibles:\n- !verificar\n- !ban (usuario) (razón)\n- !unban (usuario) (razón)");
    }
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
        mostrarPestania("inicio");
        return;
    }

    const discord = regDiscord.value.trim();
    const roblox = regRoblox.value.trim();
    const pass = regPass.value.trim();

    if (!discord || !roblox || !pass) {
        alert("Completa todos los campos");
        return;
    }

    const existe = await db.collection("usuarios")
        .where("discord", "==", discord)
        .get();

    if (!existe.empty) {
        alert("Ese usuario de Discord ya existe");
        return;
    }

    await db.collection("usuarios").add({
        discord: discord,
        roblox: roblox,
        clave: pass,
        baneado: false,
        creado: Date.now()
    });

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