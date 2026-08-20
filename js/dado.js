// Juego Dado del Trago - G-LATTO
// ES5 puro, sin dependencias externas.

(function () {

  var STORAGE_KEY = 'glatto_dado_rules';

  var DEFAULT_RULES = [
    'Tomas vos solo',
    'Elegis quien toma',
    'Todos brindan',
    'Contas un chiste o tomas',
    'El de tu derecha toma',
    'Repetis la tirada'
  ];

  var ROLL_DURATION_MS = 900;
  var ROLL_STEP_MS = 80;

  var rules = [];
  var rolling = false;
  var editingIndex = -1;

  var canvas = document.getElementById('diceCanvas');
  var ctx = canvas.getContext('2d');
  var rollBtn = document.getElementById('rollBtn');
  var diceRule = document.getElementById('diceRule');
  var rulesList = document.getElementById('rulesList');
  var toggleListBtn = document.getElementById('toggleListBtn');
  var optionsBody = document.getElementById('optionsBody');

  var editOverlay = document.getElementById('editOverlay');
  var editRuleText = document.getElementById('editRuleText');
  var cancelEditBtn = document.getElementById('cancelEditBtn');
  var saveEditBtn = document.getElementById('saveEditBtn');

  function loadRules() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      saved = null;
    }
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.length === 6) {
          return parsed;
        }
      } catch (e2) {
        // datos corruptos, se ignoran
      }
    }
    return DEFAULT_RULES.slice(0);
  }

  function saveRules() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch (e) {
      // localStorage no disponible, seguimos sin guardar
    }
  }

  var PIP_LAYOUTS = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]]
  };

  function drawDiceFace(number) {
    var size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    var radius = 26;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.arcTo(size, 0, size, size, radius);
    ctx.arcTo(size, size, 0, size, radius);
    ctx.arcTo(0, size, 0, 0, radius);
    ctx.arcTo(0, 0, size, 0, radius);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#3a0f66';
    ctx.stroke();

    var pips = PIP_LAYOUTS[number] || PIP_LAYOUTS[1];
    var pipRadius = size * 0.075;
    for (var i = 0; i < pips.length; i++) {
      var px = pips[i][0] * size;
      var py = pips[i][1] * size;
      ctx.beginPath();
      ctx.arc(px, py, pipRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ab1fd6';
      ctx.fill();
    }
  }

  function onRollClick() {
    if (rolling || rules.length !== 6) { return; }
    rolling = true;
    rollBtn.disabled = true;
    diceRule.textContent = '...';

    var elapsed = 0;
    var stepTimer = setInterval(function () {
      drawDiceFace(1 + Math.floor(Math.random() * 6));
      elapsed += ROLL_STEP_MS;
      if (elapsed >= ROLL_DURATION_MS) {
        clearInterval(stepTimer);
        var finalNumber = 1 + Math.floor(Math.random() * 6);
        drawDiceFace(finalNumber);
        diceRule.textContent = finalNumber + ' - ' + rules[finalNumber - 1];
        rolling = false;
        rollBtn.disabled = false;
      }
    }, ROLL_STEP_MS);
  }

  function renderRulesList() {
    rulesList.innerHTML = '';
    for (var i = 0; i < rules.length; i++) {
      (function (index) {
        var li = document.createElement('li');

        var numberEl = document.createElement('span');
        numberEl.className = 'rule-number';
        numberEl.textContent = (index + 1);

        var textEl = document.createElement('span');
        textEl.className = 'bank-item-text';
        textEl.textContent = rules[index];

        var wrap = document.createElement('span');
        wrap.style.display = '-webkit-box';
        wrap.style.display = '-webkit-flex';
        wrap.style.display = 'flex';
        wrap.style.webkitAlignItems = 'center';
        wrap.style.alignItems = 'center';
        wrap.style.webkitBoxFlex = '1';
        wrap.style.webkitFlexGrow = '1';
        wrap.style.flexGrow = '1';
        wrap.appendChild(numberEl);
        wrap.appendChild(textEl);

        var editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '✎';
        editBtn.addEventListener('click', function () { openEditForm(index); });

        li.appendChild(wrap);
        li.appendChild(editBtn);
        rulesList.appendChild(li);
      })(i);
    }
  }

  function openEditForm(index) {
    editingIndex = index;
    editRuleText.value = rules[index];
    editOverlay.className = 'result-overlay show';
  }

  function closeEditForm() {
    editOverlay.className = 'result-overlay';
  }

  function onSaveEdit() {
    var val = editRuleText.value.replace(/^\s+|\s+$/g, '');
    if (!val) {
      showToast('Escribi una regla');
      return;
    }
    rules[editingIndex] = val;
    saveRules();
    renderRulesList();
    closeEditForm();
  }

  function init() {
    rules = loadRules();
    drawDiceFace(1);
    renderRulesList();

    rollBtn.addEventListener('click', onRollClick);
    cancelEditBtn.addEventListener('click', closeEditForm);
    saveEditBtn.addEventListener('click', onSaveEdit);

    toggleListBtn.addEventListener('click', function () {
      var isHidden = optionsBody.className.indexOf('hidden') !== -1;
      if (isHidden) {
        optionsBody.className = 'options-body';
        toggleListBtn.innerHTML = 'Ocultar &#9652;';
      } else {
        optionsBody.className = 'options-body hidden';
        toggleListBtn.innerHTML = 'Ver / editar &#9662;';
      }
    });
  }

  init();

})();
