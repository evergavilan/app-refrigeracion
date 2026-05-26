// =====================================================
// HVAC PRO ARGENTINA
// CORE/PWA.JS — Instalación PWA
// (El registro del SW está en index.html en la raíz)
// =====================================================

let deferredPrompt = null;

// =====================================================
// INSTALAR APP — botón "Agregar a pantalla de inicio"
// =====================================================

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  deferredPrompt = event;
  showInstallButton();
});

function showInstallButton() {
  if (document.getElementById("installApp")) return;

  var button = document.createElement("button");
  button.id = "installApp";
  button.style.cssText = "display:block;width:calc(100% - 32px);margin:12px 16px 0;padding:13px;border-radius:16px;background:rgba(0,217,255,.1);border:1.5px solid rgba(0,217,255,.3);color:#00d9ff;font-size:14px;font-weight:700;cursor:pointer;";
  button.innerHTML = "📲 Instalar app en el celular";

  var app = document.getElementById("app");
  if (app) app.appendChild(button);

  button.addEventListener("click", async function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    var result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      console.log("✅ App instalada");
    }
    deferredPrompt = null;
    button.remove();
  });
}

window.addEventListener("appinstalled", function () {
  console.log("✅ PWA instalada correctamente");
  deferredPrompt = null;
  var btn = document.getElementById("installApp");
  if (btn) btn.remove();
});
