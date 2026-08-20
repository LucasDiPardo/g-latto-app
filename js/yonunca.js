// Juego Yo Nunca - G-LATTO
// ES5 puro, sin dependencias externas.

(function () {

  var STORAGE_KEY = 'glatto_yonunca_options';

  var DEFAULT_OPTIONS = [
    'Yo nunca me quede dormido en una fiesta',
    'Yo nunca le mande un mensaje al ex por error',
    'Yo nunca llore viendo una pelicula',
    'Yo nunca me disfrace para Halloween',
    'Yo nunca cante karaoke',
    'Yo nunca falte al trabajo por resaca',
    'Yo nunca bese a alguien en una fiesta',
    'Yo nunca perdi las llaves de mi casa',
    'Yo nunca hice trampa en un juego de mesa',
    'Yo nunca hable con un ex durante una fiesta'
  ];

  var MAX_OPTIONS = 30;
  var MIN_OPTIONS = 1;

  var options = [];
  var queue = [];
  var queuePos = 0;

  var counter = document.getElementById('counter');
  var phraseText = document.getElementById('phraseText');
  var nextBtn = document.getElementById('nextBtn');
  var optionsList = document.getElementById('optionsList');
  var newOptionInput = document.getElementById('newOption');
  var addBtn = document.getElementById('addBtn');
  var resetBtn = document.getElementById('resetBtn');
  var hintMsg = document.getElementById('hintMsg');
  var toggleListBtn = document.getElementById('toggleListBtn');
  var optionsBody = document.getElementById('optionsBody');

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
        if (parsed && parsed.length >= 0) {
          return parsed;
        }
      } catch (e2) {
        // datos corruptos, se ignoran
      }
    }
    return DEFAULT_OPTIONS.slice(0);
  }

  function saveOptions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch (e) {
      // localStorage no disponible, seguimos sin guardar
    }
  }

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

  function buildQueue() {
    var indices = [];
    for (var i = 0; i < options.length; i++) { indices.push(i); }
    queue = shuffle(indices);
    queuePos = 0;
  }

  function renderPhrase() {
    if (options.length === 0) {
      counter.textContent = 'Sin frases';
      phraseText.textContent = 'Agrega frases para empezar';
      nextBtn.disabled = true;
      return;
    }

    if (queue.length === 0 || queuePos >= queue.length) {
      buildQueue();
    }

    var index = queue[queuePos];
    counter.textContent = 'Frase ' + (queuePos + 1) + ' de ' + queue.length;
    phraseText.textContent = options[index];
    nextBtn.disabled = false;
  }

  function onNextClick() {
    queuePos++;
    renderPhrase();
  }

  function renderOptionsList() {
    optionsList.innerHTML = '';
    for (var i = 0; i < options.length; i++) {
      (function (index) {
        var li = document.createElement('li');

        var name = document.createElement('span');
        name.className = 'opt-name';
        name.textContent = options[index];

        var removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function () { onRemoveClick(index); });

        li.appendChild(name);
        li.appendChild(removeBtn);
        optionsList.appendChild(li);
      })(i);
    }
    updateHint();
  }

  function updateHint() {
    if (options.length < MIN_OPTIONS) {
      hintMsg.textContent = 'Agrega al menos una frase.';
    } else if (options.length >= MAX_OPTIONS) {
      hintMsg.textContent = 'Llegaste al maximo de ' + MAX_OPTIONS + ' frases.';
    } else {
      hintMsg.textContent = '';
    }
  }

  function onRemoveClick(index) {
    options.splice(index, 1);
    saveOptions();
    renderOptionsList();
    buildQueue();
    renderPhrase();
  }

  function onAddClick() {
    var val = newOptionInput.value.replace(/^\s+|\s+$/g, '');
    if (!val) { return; }
    if (options.length >= MAX_OPTIONS) {
      showToast('Maximo ' + MAX_OPTIONS + ' frases');
      return;
    }
    options.push(val);
    newOptionInput.value = '';
    saveOptions();
    renderOptionsList();
    buildQueue();
    renderPhrase();
  }

  function onResetClick() {
    var ok = window.confirm('Restaurar las frases por defecto?');
    if (!ok) { return; }
    options = DEFAULT_OPTIONS.slice(0);
    saveOptions();
    renderOptionsList();
    buildQueue();
    renderPhrase();
    showToast('Frases restauradas');
  }

  function init() {
    options = loadOptions();
    buildQueue();
    renderPhrase();
    renderOptionsList();

    nextBtn.addEventListener('click', onNextClick);
    addBtn.addEventListener('click', onAddClick);
    resetBtn.addEventListener('click', onResetClick);

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

    newOptionInput.addEventListener('keydown', function (e) {
      if (e.keyCode === 13) {
        onAddClick();
      }
    });
  }

  init();

})();
