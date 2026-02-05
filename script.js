// ==================== FUNCIONES AUXILIARES ====================

function mostrarPestania(id) {
    document.querySelectorAll('.pestana').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    enviarLog("Cambio de pestaña: " + id);
}

function detectarComando(e) {
    if (e.key === "Enter") {
        ejecutarComando(e.target.value);
        e.target.value = "";
    }
}

function ejecutarComando(cmd) {
    if (cmd.startsWith("!rejoin")) {
        location.reload();
        return;
    }
    alert("Comando inválido o sin permisos");
}

function mostrarOverlayLogin() {
    document.getElementById("overlayLogin").style.display = "flex";
}

function ocultarOverlayLogin() {
    document.getElementById("overlayLogin").style.display = "none";
}

// ==================== OVERLAY DE IPs ====================

function mostrarOverlayIPs(usuario, ips) {
    const overlay = document.getElementById("overlayIPs");
    const titulo = document.getElementById("tituloIPs");
    const lista = document.getElementById("listaIPs");
    
    // Actualizar título
    titulo.textContent = `IPs encontradas para: ${usuario}`;
    
    // Limpiar lista anterior
    lista.innerHTML = "";
    
    // Agregar cada IP
    ips.forEach((ip, index) => {
        const ipItem = document.createElement("div");
        ipItem.className = "ip-item";
        ipItem.innerHTML = `
            <strong>IP ${index + 1}:</strong> ${ip}
            <button style="margin-top: 8px; background: #d9534f;" 
                    onclick="copiarIP('${ip}')">
                📋 Copiar IP
            </button>
        `;
        lista.appendChild(ipItem);
    });
    
    // Mostrar overlay
    overlay.style.display = "flex";
}

function cerrarOverlayIPs() {
    document.getElementById("overlayIPs").style.display = "none";
}

function copiarIP(ip) {
    // Copiar al portapapeles
    navigator.clipboard.writeText(ip).then(() => {
        alert("✅ IP copiada al portapapeles: " + ip);
    }).catch(err => {
        console.error("Error copiando IP:", err);
        alert("❌ No se pudo copiar la IP");
    });
}