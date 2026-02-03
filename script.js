/* =========================
   COMANDOS SUPERIORES
========================= */

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("commandInput");
    if (!input) return;

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            const comando = input.value.trim();
            input.value = "";
            if (comando !== "") ejecutarComando(comando);
        }
    });
});

function ejecutarComando(cmd) {
    const partes = cmd.split(" ");

    switch (partes[0]) {
        case "!rejoin":
            enviarLog("Comando: !rejoin");
            location.reload();
            break;

        case "!ban":
            banUsuario(partes[1], partes.slice(2).join(" "));
            break;

        case "!unban":
            unbanUsuario(partes[1], partes.slice(2).join(" "));
            break;

        default:
            alert("Comando no reconocido");
            enviarLog("Comando inválido: " + cmd);
    }
}

/* =========================
   EVENTOS DE SALIDA
========================= */

window.addEventListener("beforeunload", () => {
    enviarLog("Cerró la pestaña o navegador");
});

/* =========================
   SISTEMA DE PESTAÑAS
========================= */

function ocultarTodasLasPestanas() {
    document.querySelectorAll(".pestana").forEach(p => {
        p.style.display = "none";
    });
}

function mostrarPestania(id) {
    ocultarTodasLasPestanas();

    const pestana = document.getElementById(id);
    if (pestana) {
        pestana.style.display = "block";
        enviarLog("Cambio de pestaña → " + id);
    }
}

/* =========================
   CARGA INICIAL
========================= */

window.onload = () => {
    ocultarTodasLasPestanas();
    autologin(); // si falla, no muestra nada
};
