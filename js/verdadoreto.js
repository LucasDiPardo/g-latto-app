// Juego Verdad o Reto - G-LATTO
// ES5 puro, sin dependencias externas.

(function () {

  var DEFAULT_VERDAD = [
    'Cual fue tu peor cita?',
    'A quien de la fiesta invitarias a tu casa a comer?',
    'Cual es tu mayor miedo?',
    'Contale a todos tu mensaje mas vergonzoso',
    'Cual fue la mentira mas grande que dijiste este año?',
    'A quien seguirias aunque te mudes a otro pais?',
    'Cual es tu red social favorita para stalkear?',
    'Que harias si ganaras la loteria manana?'
  ];

  var DEFAULT_RETO = [
    'Baila 20 segundos sin musica',
    'Habla con acento hasta tu proximo turno',
    'Dejate tomar una foto graciosa',
    'Imita a alguien de la fiesta',
    'Canta el estribillo de tu cancion favorita',
    'Hace 10 sentadillas',
    'Cuenta un chiste malo',
    'Dale un cumplido sincero a la persona de tu derecha'
  ];

  var MAX_ITEMS = 30;

  function shuffle(arr) {
    var a = arr.slice(0);
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function makeBank(storageKey, defaults) {
    var items = [];
    var queue = [];
    var queuePos = 0;

    function load() {
      var saved = null;
      try {
        saved = localStorage.getItem(storageKey);
      } catch (e) {
        saved = null;
      }
      if (saved) {
        try {
          var parsed = JSON.parse(saved);
          if (parsed) { return parsed; }
        } catch (e2) {
          // datos corruptos, se ignoran
        }
      }
      return defaults.slice(0);
    }

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch (e) {
        // localStorage no disponible, seguimos sin guardar
      }
    }

    function buildQueue() {
      var indices = [];
      for (var i = 0; i < items.length; i++) { indices.push(i); }
      queue = shuffle(indices);
      queuePos = 0;
    }

    items = load();
    buildQueue();

    return {
      getItems: function () { return items; },
      count: function () { return items.length; },
      add: function (text) {
        items.push(text);
        save();
        buildQueue();
      },
      remove: function (index) {
        items.splice(index, 1);
        save();
        buildQueue();
      },
      reset: function () {
        items = defaults.slice(0);
        save();
        buildQueue();
      },
      next: function () {
        if (items.length === 0) { return null; }
        if (queue.length === 0 || queuePos >= queue.length) {
          buildQueue();
        } else {
          queuePos++;
          if (queuePos >= queue.length) { buildQueue(); }
        }
        return items[queue[queuePos]];
      },
      current: function () {
        if (items.length === 0) { return null; }
        if (queue.length === 0) { buildQueue(); }
        return items[queue[queuePos]];
      }
    };
  }

  var verdadBank = makeBank('glatto_verdad_items', DEFAULT_VERDAD);
  var retoBank = makeBank('glatto_reto_items', DEFAULT_RETO);

  var mode = null; // 'verdad' | 'reto' | null

  var choiceRow = document.getElementById('choiceRow');
  var cardArea = document.getElementById('cardArea');
  var cardCounter = document.getElementById('cardCounter');
  var cardText = document.getElementById('cardText');
  var verdadBtn = document.getElementById('verdadBtn');
  var retoBtn = document.getElementById('retoBtn');
  var backBtn = document.getElementById('backBtn');
  var nextCardBtn = document.getElementById('nextCardBtn');

  var verdadList = document.getElementById('verdadList');
  var newVerdadInput = document.getElementById('newVerdad');
  var addVerdadBtn = document.getElementById('addVerdadBtn');
  var resetVerdadBtn = document.getElementById('resetVerdadBtn');

  var retoList = document.getElementById('retoList');
  var newRetoInput = document.getElementById('newReto');
  var addRetoBtn = document.getElementById('addRetoBtn');
  var resetRetoBtn = document.getElementById('resetRetoBtn');

  var toggleVerdadBtn = document.getElementById('toggleVerdadBtn');
  var verdadBody = document.getElementById('verdadBody');
  var toggleRetoBtn = document.getElementById('toggleRetoBtn');
  var retoBody = document.getElementById('retoBody');

  function wireToggle(btn, body) {
    btn.addEventListener('click', function () {
      var isHidden = body.className.indexOf('hidden') !== -1;
      if (isHidden) {
        body.className = 'options-body';
        btn.innerHTML = 'Ocultar &#9652;';
      } else {
        body.className = 'options-body hidden';
        btn.innerHTML = 'Ver / editar &#9662;';
      }
    });
  }

  function trim(s) {
    return s.replace(/^\s+|\s+$/g, '');
  }

  function renderList(listEl, bank) {
    listEl.innerHTML = '';
    var items = bank.getItems();
    for (var i = 0; i < items.length; i++) {
      (function (index) {
        var li = document.createElement('li');

        var name = document.createElement('span');
        name.className = 'opt-name';
        name.textContent = items[index];

        var removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function () {
          bank.remove(index);
          renderList(listEl, bank);
          if (mode === 'verdad' && listEl === verdadList) { showCard(); }
          if (mode === 'reto' && listEl === retoList) { showCard(); }
        });

        li.appendChild(name);
        li.appendChild(removeBtn);
        listEl.appendChild(li);
      })(i);
    }
  }

  function showChoice() {
    mode = null;
    choiceRow.style.display = '-webkit-box';
    choiceRow.style.display = '-webkit-flex';
    choiceRow.style.display = 'flex';
    cardArea.style.display = 'none';
  }

  function showCard() {
    var bank = mode === 'verdad' ? verdadBank : retoBank;
    var label = mode === 'verdad' ? 'Verdad' : 'Reto';
    var text = bank.current();

    choiceRow.style.display = 'none';
    cardArea.style.display = 'block';
    cardCounter.textContent = label;

    if (text === null) {
      cardText.textContent = 'Agrega ' + (mode === 'verdad' ? 'preguntas' : 'retos') + ' para jugar';
      nextCardBtn.disabled = true;
    } else {
      cardText.textContent = text;
      nextCardBtn.disabled = false;
    }
  }

  function onNextCard() {
    var bank = mode === 'verdad' ? verdadBank : retoBank;
    var text = bank.next();
    cardText.textContent = text === null ? 'Agrega mas para seguir jugando' : text;
  }

  function init() {
    renderList(verdadList, verdadBank);
    renderList(retoList, retoBank);

    verdadBtn.addEventListener('click', function () { mode = 'verdad'; showCard(); });
    retoBtn.addEventListener('click', function () { mode = 'reto'; showCard(); });
    backBtn.addEventListener('click', showChoice);
    nextCardBtn.addEventListener('click', onNextCard);

    addVerdadBtn.addEventListener('click', function () {
      var val = trim(newVerdadInput.value);
      if (!val) { return; }
      if (verdadBank.count() >= MAX_ITEMS) { showToast('Maximo ' + MAX_ITEMS); return; }
      verdadBank.add(val);
      newVerdadInput.value = '';
      renderList(verdadList, verdadBank);
    });

    addRetoBtn.addEventListener('click', function () {
      var val = trim(newRetoInput.value);
      if (!val) { return; }
      if (retoBank.count() >= MAX_ITEMS) { showToast('Maximo ' + MAX_ITEMS); return; }
      retoBank.add(val);
      newRetoInput.value = '';
      renderList(retoList, retoBank);
    });

    resetVerdadBtn.addEventListener('click', function () {
      if (!window.confirm('Restaurar preguntas de verdad por defecto?')) { return; }
      verdadBank.reset();
      renderList(verdadList, verdadBank);
      showToast('Verdad restaurado');
    });

    resetRetoBtn.addEventListener('click', function () {
      if (!window.confirm('Restaurar retos por defecto?')) { return; }
      retoBank.reset();
      renderList(retoList, retoBank);
      showToast('Retos restaurados');
    });

    newVerdadInput.addEventListener('keydown', function (e) {
      if (e.keyCode === 13) { addVerdadBtn.click(); }
    });
    newRetoInput.addEventListener('keydown', function (e) {
      if (e.keyCode === 13) { addRetoBtn.click(); }
    });

    wireToggle(toggleVerdadBtn, verdadBody);
    wireToggle(toggleRetoBtn, retoBody);
  }

  init();

})();
