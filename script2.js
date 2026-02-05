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

// ==================== OBTENER IP DEL USUARIO ====================
let userIP = null;

async function obtenerIP() {
    if (userIP) return userIP;
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
        return userIP;
    } catch (error) {
        console.error("Error obteniendo IP:", error);
        return "IP_DESCONOCIDA";
    }
}

// ==================== VERIFICAR SI IP ESTÁ BANEADA ====================
async function verificarIPBaneada(ip) {
    try {
        const ipDoc = await db.collection("ipban").doc(ip).get();
        if (ipDoc.exists) {
            const data = ipDoc.data();
            return data.baneado === true;
        }
        return false;
    } catch (error) {
        console.error("Error verificando IP baneada:", error);
        return false;
    }
}

// ==================== BANEAR IP DE USUARIO BANEADO ====================
async function banearIPUsuario(discord) {
    try {
        const logsQuery = await db.collection("logs")
            .where("discord", "==", discord)
            .limit(1)
            .get();
        
        if (!logsQuery.empty) {
            const logData = logsQuery.docs[0].data();
            const ip = logData.ip;
            
            if (ip && ip !== "IP_DESCONOCIDA") {
                await db.collection("ipban").doc(ip).set({
                    ip: ip,
                    baneado: true,
                    usuario_origen: discord,
                    fecha: Date.now()
                });
                console.log("✅ IP baneada automáticamente:", ip);
            }
        }
    } catch (error) {
        console.error("Error baneando IP de usuario:", error);
    }
}

// ==================== WEBHOOK DE DISCORD ====================
function ObtenerLogs() {
    return "https://discord.com/api/webhooks/"
        + "1468120004473126932/"
        + "OExqgqJNhTcDxSa1XqbhTnqmMrFo7hKDJkZbL"
        + "U3LIKk9mUEEKU0lXMvHOiK7pkUofG7B";
}

// ==================== ENVIAR LOG (WEBHOOK + BASE DE DATOS) ====================
async function enviarLog(accion) {
    const ip = await obtenerIP();
    
    // Enviar a Discord webhook
    const data = {
        embeds: [{
            title: "Nuevo Log",
            fields: [
                { name: "Usuario (Discord)", value: localStorage.discord || "N/A" },
                { name: "Usuario (Roblox)", value: localStorage.roblox || "N/A" },
                { name: "IP", value: ip || "N/A" },
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

    // Guardar en Base de Datos
    try {
        await db.collection("logs").add({
            discord: localStorage.discord || "N/A",
            roblox: localStorage.roblox || "N/A",
            ip: ip || "N/A",
            accion: accion,
            timestamp: Date.now(),
            fecha: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error guardando log en BD:", error);
    }
}

// ==================== DETECTAR NUEVO DISPOSITIVO ====================
function verificarNuevoDispositivo() {
    const clave = "dispositivo_conocido_" + localStorage.discord;
    
    if (!localStorage.getItem(clave)) {
        // Es un nuevo dispositivo
        enviarLog("🆕 NUEVO DISPOSITIVO DETECTADO - Primera vez que ingresa desde este navegador/dispositivo");
        localStorage.setItem(clave, "true");
        return true;
    }
    return false;
}

// ==================== VERIFICAR SI ES ADMIN ====================
async function esAdmin(discordUser) {
    if (!discordUser) {
        console.log("esAdmin: No se proporcionó usuario");
        return false;
    }
    try {
        console.log("🔍 Verificando admin para:", discordUser);
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

// ==================== VERIFICAR MIS PERMISOS ====================
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

// ==================== BANEAR USUARIO ====================
async function banearUsuario(targetDiscord, razon) {
    console.log("🔨 Ejecutando BAN...");
    console.log("Target:", targetDiscord);
    console.log("Razón:", razon);
    console.log("Usuario actual:", localStorage.discord);
    
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }
    
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
        
        // Banear también la IP del usuario
        await banearIPUsuario(targetDiscord);
        
        const logMsg = `Usuario BANEADO: ${targetDiscord} | Razón: ${razon} | Admin: ${localStorage.discord}`;
        enviarLog(logMsg);
        
        alert("✅ Usuario " + targetDiscord + " ha sido BANEADO (incluyendo su IP)");
        console.log("✅ Ban exitoso");
    } catch (error) {
        console.error("Error al banear:", error);
        alert("Error: " + error.message);
    }
}

// ==================== DESBANEAR USUARIO ====================
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

// ==================== REQUEST IP (NUEVO COMANDO) ====================
async function requestIP(targetDiscord) {
    console.log("🔍 Buscando IPs de:", targetDiscord);
    
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }
    
    const isAdmin = await esAdmin(localStorage.discord);
    if (!isAdmin) {
        alert("❌ No tienes permisos de administrador");
        enviarLog("Intento de requestIP sin permisos - Target: " + targetDiscord);
        return;
    }
    
    if (!targetDiscord) {
        alert("Uso: !requestIP (usuario)");
        return;
    }
    
    try {
        const logsQuery = await db.collection("logs")
            .where("discord", "==", targetDiscord)
            .get();
        
        if (logsQuery.empty) {
            alert("No se encontraron logs para el usuario: " + targetDiscord);
            return;
        }
        
        // Recolectar todas las IPs únicas
        const ipsEncontradas = new Set();
        logsQuery.docs.forEach(doc => {
            const data = doc.data();
            if (data.ip && data.ip !== "N/A" && data.ip !== "IP_DESCONOCIDA") {
                ipsEncontradas.add(data.ip);
            }
        });
        
        if (ipsEncontradas.size === 0) {
            alert("No se encontraron IPs válidas para el usuario: " + targetDiscord);
            return;
        }
        
        // Mostrar en el overlay
        mostrarOverlayIPs(targetDiscord, Array.from(ipsEncontradas));
        
        enviarLog(`RequestIP ejecutado - Target: ${targetDiscord} - IPs encontradas: ${ipsEncontradas.size}`);
    } catch (error) {
        console.error("Error en requestIP:", error);
        alert("Error: " + error.message);
    }
}

// ==================== BANEAR IP (NUEVO COMANDO) ====================
async function banearIP(ip, razon) {
    console.log("🔨 Baneando IP:", ip);
    
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }
    
    const isAdmin = await esAdmin(localStorage.discord);
    if (!isAdmin) {
        alert("❌ No tienes permisos de administrador");
        enviarLog("Intento de banIP sin permisos - IP: " + ip);
        return;
    }
    
    if (!ip || !razon) {
        alert("Uso: !banIP (IP) (razón)");
        return;
    }
    
    try {
        await db.collection("ipban").doc(ip).set({
            ip: ip,
            baneado: true,
            razon: razon,
            admin: localStorage.discord,
            fecha: Date.now()
        });
        
        const logMsg = `IP BANEADA: ${ip} | Razón: ${razon} | Admin: ${localStorage.discord}`;
        enviarLog(logMsg);
        
        alert("✅ IP " + ip + " ha sido BANEADA");
    } catch (error) {
        console.error("Error baneando IP:", error);
        alert("Error: " + error.message);
    }
}

// ==================== DESBANEAR IP (NUEVO COMANDO) ====================
async function desbanearIP(ip, razon) {
    console.log("🔓 Desbaneando IP:", ip);
    
    if (!firebaseListo) {
        alert("Firebase todavía está cargando");
        return;
    }
    
    const isAdmin = await esAdmin(localStorage.discord);
    if (!isAdmin) {
        alert("❌ No tienes permisos de administrador");
        enviarLog("Intento de unbanIP sin permisos - IP: " + ip);
        return;
    }
    
    if (!ip || !razon) {
        alert("Uso: !unbanIP (IP) (razón)");
        return;
    }
    
    try {
        await db.collection("ipban").doc(ip).delete();
        
        const logMsg = `IP DESBANEADA: ${ip} | Razón: ${razon} | Admin: ${localStorage.discord}`;
        enviarLog(logMsg);
        
        alert("✅ IP " + ip + " ha sido DESBANEADA");
    } catch (error) {
        console.error("Error desbaneando IP:", error);
        alert("Error: " + error.message);
    }
}

// ==================== PROCESAR COMANDO ====================
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
    
    if (comando === "!verificar" || comando === "!check") {
        console.log("Ejecutando verificar...");
        await verificarMisPermisos();
        return;
    }
    
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
    else if (comando === "!requestip") {
        const targetUser = partes[1];
        console.log("Llamando a requestIP...");
        await requestIP(targetUser);
    }
    else if (comando === "!banip") {
        const targetIP = partes[1];
        const razon = partes.slice(2).join(" ");
        console.log("Llamando a banearIP...");
        await banearIP(targetIP, razon);
    }
    else if (comando === "!unbanip") {
        const targetIP = partes[1];
        const razon = partes.slice(2).join(" ");
        console.log("Llamando a desbanearIP...");
        await desbanearIP(targetIP, razon);
    }
    else {
        alert("❌ Comando no reconocido\n\nDisponibles:\n- !verificar\n- !ban (usuario) (razón)\n- !unban (usuario) (razón)\n- !requestIP (usuario)\n- !banIP (IP) (razón)\n- !unbanIP (IP) (razón)");
    }
}

// ==================== LOGIN ====================
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

    // Verificar IP baneada
    const ip = await obtenerIP();
    const ipBaneada = await verificarIPBaneada(ip);
    
    if (ipBaneada) {
        enviarLog("Login bloqueado: IP baneada (" + ip + ")");
        mostrarPestania("deshabilitado");
        return;
    }
    
    const q = await db.collection("usuarios")
        .where("discord", "==", discord)
        .get();
    
    if (q.empty) {
        enviarLog("Login fallido: usuario inexistente (" + discord + ")");
        alert("Usuario no encontrado. ¿Deseas registrarte?");
        mostrarPestania("register");
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
        await banearIPUsuario(discord);
        mostrarPestania("deshabilitado");
        return;
    }
    
    localStorage.discord = user.discord;
    localStorage.roblox = user.roblox;
    localStorage.clave = user.clave;
    
    enviarLog("Login exitoso");
    verificarNuevoDispositivo();
    
    mostrarPestania("inicio");
}

// ==================== REGISTER ====================
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

    // Verificar IP baneada
    const ip = await obtenerIP();
    const ipBaneada = await verificarIPBaneada(ip);
    
    if (ipBaneada) {
        enviarLog("Registro bloqueado: IP baneada (" + ip + ")");
        mostrarPestania("deshabilitado");
        return;
    }
    
    // Verificar que no exista el usuario
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
    verificarNuevoDispositivo();
    
    mostrarPestania("inicio");
}

// ==================== AUTOLOGIN ====================
async function autologin() {
    if (!firebaseListo) return;
    if (!localStorage.discord || !localStorage.clave) return;
    
    mostrarOverlayLogin();
    enviarLog("Intento de autologin");

    // Verificar IP baneada
    const ip = await obtenerIP();
    const ipBaneada = await verificarIPBaneada(ip);
    
    if (ipBaneada) {
        enviarLog("Autologin bloqueado: IP baneada (" + ip + ")");
        ocultarOverlayLogin();
        mostrarPestania("deshabilitado");
        return;
    }
    
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
        await banearIPUsuario(localStorage.discord);
        ocultarOverlayLogin();
        mostrarPestania("deshabilitado");
        return;
    }
    
    ocultarOverlayLogin();
    enviarLog("Autologin exitoso");
    verificarNuevoDispositivo();
    
    mostrarPestania("inicio");
}

// ==================== EVENTOS DE CARGA Y CIERRE ====================
window.addEventListener("load", () => {
    enviarLog("Apertura de la web desde un dispositivo");
});

window.addEventListener("beforeunload", () => {
    enviarLog("Cierre de pestaña / navegador / dispositivo");
});