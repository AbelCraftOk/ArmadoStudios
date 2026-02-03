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

// 🔍 FUNCIÓN DE DEBUG PARA VERIFICAR PERMISOS (SIN RESTRICCIONES)
async function verificarMisPermisos() {
    console.log("=== VERIFICANDO PERMISOS ===");
    console.log("Usuario en localStorage:", localStorage.discord);
    
    if (!localStorage.discord) {
        console.log("❌ No hay usuario en localStorage");
        alert("No hay sesión iniciada");
        return;
    }
    
    try {
        console.log("Buscando documento en: admins/" + localStorage.discord);
        
        // Intentar obtener el documento por ID
        const adminDoc = await db.collection("admins")
            .doc(localStorage.discord)
            .get();
        
        console.log("Documento existe:", adminDoc.exists);
        
        if (adminDoc.exists) {
            const data = adminDoc.data();
            console.log("✅ Datos del documento:", data);
            console.log("Campo 'admin':", data.admin);
            console.log("Campo 'perms':", data.perms);
            console.log("Tipo de 'perms':", typeof data.perms);
            console.log("Comparación perms === true:", data.perms === true);
            console.log("Comparación perms == true:", data.perms == true);
            
            alert(`✅ Documento encontrado!\nPerms: ${data.perms}\nTipo: ${typeof data.perms}\nEs admin: ${data.perms === true}`);
        } else {
            console.log("❌ El documento NO existe en admins/" + localStorage.discord);
            
            // Listar TODOS los documentos de admins para ver qué hay
            console.log("Listando todos los admins...");
            const todosAdmins = await db.collection("admins").get();
            console.log("Total de documentos en 'admins':", todosAdmins.size);
            
            let listaAdmins = "Admins encontrados:\n";
            todosAdmins.forEach(doc => {
                console.log("---");
                console.log("ID del documento:", doc.id);
                console.log("Datos:", doc.data());
                listaAdmins += `\n- ID: ${doc.id}\n  Datos: ${JSON.stringify(doc.data())}`;
            });
            
            alert(`❌ No estás en la lista de admins.\n\nTu usuario: ${localStorage.discord}\n\n${listaAdmins}\n\nRevisa la consola (F12) para más detalles.`);
        }
    } catch (error) {
        console.error("❌ Error al verificar permisos:", error);
        alert("Error al verificar permisos: " + error.message);
    }
}

// ✅ VERIFICAR SI EL USUARIO ES ADMINISTRADOR (VERSIÓN MEJORADA)
async function esAdmin(discordUser) {
    if (!discordUser) {
        console.log("esAdmin: No se proporcionó usuario");
        return false;
    }
    
    try {
        console.log("Verificando admin para:", discordUser);
        
        // Método 1: Buscar por ID del documento
        const adminDoc = await db.collection("admins")
            .doc(discordUser)
            .get();
        
        if (adminDoc.exists) {
            const data = adminDoc.data();
            console.log("Encontrado por ID. Datos:", data);
            console.log("Valor de perms:", data.perms, "Tipo:", typeof data.perms);
            return data.perms === true;
        }
        
        // Método 2: Buscar por campo "admin" (por si está guardado diferente)
        console.log("No encontrado por ID, buscando por campo 'admin'...");
        const querySnapshot = await db.collection("admins")
            .where("admin", "==", discordUser)
            .get();
        
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            console.log("Encontrado por query. Datos:", data);
            console.log("Valor de perms:", data.perms, "Tipo:", typeof data.perms);
            return data.perms === true;
        }
        
        console.log("No se encontró como admin");
        return false;
        
    } catch (error) {
        console.error("Error verificando admin:", error);
        return false;
    }
}

// 🔨 COMANDO !BAN
async function banearUsuario(targetDiscord, razon) {
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }

    // Verificar que el usuario actual sea admin
    const isAdmin = await esAdmin(localStorage.discord);
    if (!isAdmin) {
        alert("❌ No tienes permisos de administrador.\n\nUsa el comando: !verificar");
        enviarLog("Intento de ban sin permisos - Target: " + targetDiscord);
        return;
    }

    if (!targetDiscord || !razon) {
        alert("Uso: !ban (usuario) (razón)");
        return;
    }

    try {
        // Buscar el usuario a banear
        const q = await db.collection("usuarios")
            .where("discord", "==", targetDiscord)
            .get();

        if (q.empty) {
            alert("Usuario no encontrado: " + targetDiscord);
            return;
        }

        const docId = q.docs[0].id;

        // Actualizar estado de baneo
        await db.collection("usuarios").doc(docId).update({
            baneado: true
        });

        const logMsg = `Usuario BANEADO: ${targetDiscord} | Razón: ${razon} | Admin: ${localStorage.discord}`;
        enviarLog(logMsg);
        alert("✅ Usuario " + targetDiscord + " ha sido baneado exitosamente");
    } catch (error) {
        console.error("Error al banear:", error);
        alert("Error al ejecutar el comando: " + error.message);
    }
}

// 🔓 COMANDO !UNBAN
async function desbanearUsuario(targetDiscord, razon) {
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }

    // Verificar que el usuario actual sea admin
    const isAdmin = await esAdmin(localStorage.discord);
    if (!isAdmin) {
        alert("❌ No tienes permisos de administrador.\n\nUsa el comando: !verificar");
        enviarLog("Intento de unban sin permisos - Target: " + targetDiscord);
        return;
    }

    if (!targetDiscord || !razon) {
        alert("Uso: !unban (usuario) (razón)");
        return;
    }

    try {
        // Buscar el usuario a desbanear
        const q = await db.collection("usuarios")
            .where("discord", "==", targetDiscord)
            .get();

        if (q.empty) {
            alert("Usuario no encontrado: " + targetDiscord);
            return;
        }

        const docId = q.docs[0].id;

        // Actualizar estado de baneo
        await db.collection("usuarios").doc(docId).update({
            baneado: false
        });

        const logMsg = `Usuario DESBANEADO: ${targetDiscord} | Razón: ${razon} | Admin: ${localStorage.discord}`;
        enviarLog(logMsg);
        alert("✅ Usuario " + targetDiscord + " ha sido desbaneado exitosamente");
    } catch (error) {
        console.error("Error al desbanear:", error);
        alert("Error al ejecutar el comando: " + error.message);
    }
}

// 💬 PROCESAR COMANDOS DE CHAT
async function procesarComando(mensaje) {
    mensaje = mensaje.trim();
    
    if (!mensaje.startsWith("!")) {
        alert("Los comandos deben empezar con !");
        return;
    }

    const partes = mensaje.split(" ");
    const comando = partes[0].toLowerCase();

    // ⚠️ COMANDO !VERIFICAR NO REQUIERE PERMISOS
    if (comando === "!verificar" || comando === "!check" || comando === "!debug") {
        await verificarMisPermisos();
        return; // Salir aquí para no pedir permisos
    }

    // Los demás comandos sí requieren permisos
    if (comando === "!ban") {
        const targetUser = partes[1];
        const razon = partes.slice(2).join(" ");
        await banearUsuario(targetUser, razon);
    } 
    else if (comando === "!unban") {
        const targetUser = partes[1];
        const razon = partes.slice(2).join(" ");
        await desbanearUsuario(targetUser, razon);
    }
    else {
        alert("❌ Comando no reconocido.\n\nComandos disponibles:\n- !verificar (ver tus permisos)\n- !ban (usuario) (razón)\n- !unban (usuario) (razón)");
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