// Juego de la Ruleta - G-LATTO
// ES5 puro, sin dependencias externas, pensado para Safari iOS9 / Android WebView viejo.

(function () {

  var STORAGE_KEY = 'glatto_ruleta_options';

  var DEFAULT_OPTIONS = [
    'Toma 1 trago',
    'Toma 2 tragos',
    'Elegi quien toma',
    'Todos toman',
    'Se salva, no toma',
    'Regala tu trago',
    'Baila 15 segundos',
    'Cuenta un secreto'
  ];

  var PALETTE = [
    '#ab1fd6', '#7b1fa2', '#e14fd4', '#5c1799',
    '#ff6fd8', '#4a148c', '#c158dc', '#8e24aa',
    '#d500f9', '#6a1b9a', '#9c27b0', '#ba68c8'
  ];

  var EXTRA_SPINS = 6;
  var SPIN_DURATION_MS = 4200;
  var MAX_OPTIONS = 12;
  var MIN_OPTIONS = 2;

  var options = [];
  var currentRotation = 0;
  var spinning = false;

  var canvas = document.getElementById('wheelCanvas');
  var ctx = canvas.getContext('2d');
  var wheelSpin = document.getElementById('wheelSpin');
  var spinBtn = document.getElementById('spinBtn');
  var optionsList = document.getElementById('optionsList');
  var newOptionInput = document.getElementById('newOption');
  var addBtn = document.getElementById('addBtn');
  var resetBtn = document.getElementById('resetBtn');
  var hintMsg = document.getElementById('hintMsg');
  var resultOverlay = document.getElementById('resultOverlay');
  var resultText = document.getElementById('resultText');
  var closeResultBtn = document.getElementById('closeResult');

  function loadOptions() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      saved = null;
    }
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.length >= MIN_OPTIONS) {
          return parsed;
        }
      } catch (e2) {
        // ignora datos corruptos y usa default
      }
    }
    return DEFAULT_OPTIONS.slice(0);
  }

  function saveOptions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch (e) {
      // localStorage no disponible (modo privado, etc), seguimos sin guardar
    }
  }

  function colorFor(i) {
    return PALETTE[i % PALETTE.length];
  }

  function truncateText(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }
    var t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
      t = t.substring(0, t.length - 1);
    }
    return t + '…';
  }

  function drawWheel() {
    var size = canvas.width;
    var center = size / 2;
    var radius = size / 2;
    var n = options.length;
    var sliceAngle = (Math.PI * 2) / n;
    var fontSize = Math.max(13, Math.min(22, 220 / n));

    ctx.clearRect(0, 0, size, size);

    for (var i = 0; i < n; i++) {
      var startAngle = -Math.PI / 2 + i * sliceAngle;
      var endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colorFor(i);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + fontSize + 'px Helvetica, Arial, sans-serif';
      var label = truncateText(options[i], radius - 46);
      ctx.fillText(label, radius - 20, 0);
      ctx.restore();
    }

    // circulo central decorativo
    ctx.beginPath();
    ctx.arc(center, center, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3a0f66';
    ctx.stroke();
  }

  function renderOptionsList() {
    optionsList.innerHTML = '';
    for (var i = 0; i < options.length; i++) {
      var li = document.createElement('li');

      var swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.backgroundColor = colorFor(i);

      var name = document.createElement('span');
      name.className = 'opt-name';
      name.textContent = options[i];

      var removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('data-index', i);
      removeBtn.addEventListener('click', onRemoveClick);

      li.appendChild(swatch);
      li.appendChild(name);
      li.appendChild(removeBtn);
      optionsList.appendChild(li);
    }
    updateHint();
  }

  function updateHint() {
    if (options.length < MIN_OPTIONS) {
      hintMsg.textContent = 'Agrega al menos ' + MIN_OPTIONS + ' opciones para poder girar.';
    } else if (options.length >= MAX_OPTIONS) {
      hintMsg.textContent = 'Llegaste al maximo de ' + MAX_OPTIONS + ' opciones.';
    } else {
      hintMsg.textContent = '';
    }
    spinBtn.disabled = options.length < MIN_OPTIONS || spinning;
  }

  function onRemoveClick(e) {
    if (spinning) { return; }
    var index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
    options.splice(index, 1);
    saveOptions();
    renderOptionsList();
    drawWheel();
  }

  function onAddClick() {
    if (spinning) { return; }
    var val = newOptionInput.value.replace(/^\s+|\s+$/g, '');
    if (!val) { return; }
    if (options.length >= MAX_OPTIONS) {
      showToast('Maximo ' + MAX_OPTIONS + ' opciones');
      return;
    }
    options.push(val);
    newOptionInput.value = '';
    saveOptions();
    renderOptionsList();
    drawWheel();
  }

  function onResetClick() {
    if (spinning) { return; }
    var ok = window.confirm('Restaurar las opciones por defecto de la ruleta?');
    if (!ok) { return; }
    options = DEFAULT_OPTIONS.slice(0);
    saveOptions();
    renderOptionsList();
    drawWheel();
    showToast('Opciones restauradas');
  }

  function setSpinTransition(enabled) {
    var value = enabled
      ? '-webkit-transform 4.2s cubic-bezier(0.15, 0.65, 0.15, 1), transform 4.2s cubic-bezier(0.15, 0.65, 0.15, 1)'
      : 'none';
    wheelSpin.style.webkitTransition = value;
    wheelSpin.style.transition = value;
  }

  function onSpinClick() {
    if (spinning || options.length < MIN_OPTIONS) { return; }
    spinning = true;
    spinBtn.disabled = true;

    var n = options.length;
    var sliceDeg = 360 / n;
    var chosenIndex = Math.floor(Math.random() * n);
    var centerAngleDeg = chosenIndex * sliceDeg + sliceDeg / 2;

    var maxJitter = sliceDeg * 0.32;
    var jitter = (Math.random() * 2 - 1) * maxJitter;
    var targetFromTop = ((centerAngleDeg - jitter) % 360 + 360) % 360;
    var targetMod = (360 - targetFromTop) % 360;

    var current360 = ((currentRotation % 360) + 360) % 360;
    var delta = ((targetMod - current360) + 360) % 360;
    var totalDelta = 360 * EXTRA_SPINS + delta;

    currentRotation += totalDelta;

    setSpinTransition(true);
    wheelSpin.style.webkitTransform = 'rotate(' + currentRotation + 'deg)';
    wheelSpin.style.transform = 'rotate(' + currentRotation + 'deg)';

    var finished = false;
    var onDone = function () {
      if (finished) { return; }
      finished = true;
      wheelSpin.removeEventListener('transitionend', onDone);
      wheelSpin.removeEventListener('webkitTransitionEnd', onDone);
      showResult(options[chosenIndex]);
    };
    wheelSpin.addEventListener('transitionend', onDone);
    wheelSpin.addEventListener('webkitTransitionEnd', onDone);
    // respaldo por si el evento no dispara en algun navegador viejo
    setTimeout(onDone, SPIN_DURATION_MS + 350);
  }

  function showResult(name) {
    resultText.textContent = name;
    resultOverlay.className = 'result-overlay show';
  }

  function closeResult() {
    resultOverlay.className = 'result-overlay';
    spinning = false;
    updateHint();
  }

  function init() {
    options = loadOptions();
    renderOptionsList();
    drawWheel();

    spinBtn.addEventListener('click', onSpinClick);
    addBtn.addEventListener('click', onAddClick);
    resetBtn.addEventListener('click', onResetClick);
    closeResultBtn.addEventListener('click', closeResult);

    newOptionInput.addEventListener('keydown', function (e) {
      if (e.keyCode === 13) {
        onAddClick();
      }
    });
  }

  init();

})();
