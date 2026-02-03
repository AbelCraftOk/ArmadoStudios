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
