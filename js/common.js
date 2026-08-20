// helpers compartidos - ES5 puro para compatibilidad con navegadores viejos (iOS9 Safari, Android WebView antiguo)

var toastTimer = null;

function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) { return; }
  el.textContent = msg;
  el.className = 'toast show';
  if (toastTimer) { clearTimeout(toastTimer); }
  toastTimer = setTimeout(function () {
    el.className = 'toast';
  }, 2200);
}
