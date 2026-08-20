// Juego de Preguntas de la Fiesta - G-LATTO
// ES5 puro, sin dependencias externas.

(function () {

  var STORAGE_KEY = 'glatto_preguntas_bank';

  var DEFAULT_BANK = [
    { text: 'Que trago no puede faltar en una fiesta G-Latto?', options: ['Fernet con Coca', 'Gin Tonic', 'Vodka con jugo', 'Cerveza'], correct: 0 },
    { text: 'Cual es el color oficial de G-Latto?', options: ['Morado', 'Rosa', 'Dorado', 'Negro'], correct: 0 },
    { text: 'Si G-Latto fuera un animal, cual seria?', options: ['Flamenco', 'Pantera', 'Unicornio', 'Zorro'], correct: 2 },
    { text: 'Cual es la mejor hora para llegar a la fiesta?', options: ['22:00', '23:00', '00:00', 'Despues de la 1'], correct: 2 },
    { text: 'El que pierde este juego...', options: ['Toma un trago', 'Baila una cancion', 'Cuenta un secreto', 'Hace de DJ 5 min'], correct: 0 },
    { text: 'Regla de oro de la noche', options: ['Lo que pasa en G-Latto queda en G-Latto', 'Hidratate entre trago y trago', 'Baila aunque no sepas', 'Todas las anteriores'], correct: 3 }
  ];

  var bank = [];
  var queue = [];
  var queuePos = 0;
  var currentQuestion = null;
  var selectedIndex = -1;
  var revealed = false;
  var editingIndex = -1; // -1 = modo agregar
  var pickedCorrect = 0;

  var questionCounter = document.getElementById('questionCounter');
  var questionText = document.getElementById('questionText');
  var optionsGrid = document.getElementById('optionsGrid');
  var revealBtn = document.getElementById('revealBtn');
  var nextBtn = document.getElementById('nextBtn');
  var bankList = document.getElementById('bankList');
  var addQuestionBtn = document.getElementById('addQuestionBtn');
  var resetBtn = document.getElementById('resetBtn');

  var editOverlay = document.getElementById('editOverlay');
  var editTitle = document.getElementById('editTitle');
  var editQuestionText = document.getElementById('editQuestionText');
  var editOpts = [
    document.getElementById('editOpt0'),
    document.getElementById('editOpt1'),
    document.getElementById('editOpt2'),
    document.getElementById('editOpt3')
  ];
  var correctPicker = document.getElementById('correctPicker');
  var cancelEditBtn = document.getElementById('cancelEditBtn');
  var saveEditBtn = document.getElementById('saveEditBtn');

  function loadBank() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      saved = null;
    }
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      } catch (e2) {
        // banco corrupto, se ignora
      }
    }
    return DEFAULT_BANK.slice(0);
  }

  function saveBank() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
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
    for (var i = 0; i < bank.length; i++) { indices.push(i); }
    queue = shuffle(indices);
    queuePos = 0;
  }

  function renderQuestion() {
    if (bank.length === 0) {
      questionCounter.textContent = 'Sin preguntas';
      questionText.textContent = 'Agrega preguntas para empezar';
      optionsGrid.innerHTML = '';
      revealBtn.disabled = true;
      nextBtn.disabled = true;
      currentQuestion = null;
      return;
    }

    if (queue.length === 0 || queuePos >= queue.length) {
      buildQueue();
    }

    var bankIndex = queue[queuePos];
    currentQuestion = bank[bankIndex];
    selectedIndex = -1;
    revealed = false;

    questionCounter.textContent = 'Pregunta ' + (queuePos + 1) + ' de ' + queue.length;
    questionText.textContent = currentQuestion.text;

    optionsGrid.innerHTML = '';
    for (var i = 0; i < currentQuestion.options.length; i++) {
      var b = document.createElement('button');
      b.className = 'option-btn';
      b.textContent = currentQuestion.options[i];
      b.setAttribute('data-index', i);
      b.addEventListener('click', onOptionClick);
      optionsGrid.appendChild(b);
    }

    revealBtn.disabled = false;
    nextBtn.disabled = false;
  }

  function onOptionClick(e) {
    if (revealed) { return; }
    var index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
    selectedIndex = index;
    var buttons = optionsGrid.querySelectorAll('.option-btn');
    for (var i = 0; i < buttons.length; i++) {
      if (i === index) {
        buttons[i].className = 'option-btn selected';
      } else {
        buttons[i].className = 'option-btn';
      }
    }
  }

  function onRevealClick() {
    if (!currentQuestion || revealed) { return; }
    revealed = true;
    var buttons = optionsGrid.querySelectorAll('.option-btn');
    for (var i = 0; i < buttons.length; i++) {
      var cls = 'option-btn locked';
      if (i === currentQuestion.correct) {
        cls += ' correct';
      } else if (i === selectedIndex) {
        cls += ' wrong';
      }
      buttons[i].className = cls;
    }
  }

  function onNextClick() {
    queuePos++;
    renderQuestion();
  }

  function renderBankList() {
    bankList.innerHTML = '';
    for (var i = 0; i < bank.length; i++) {
      (function (index) {
        var li = document.createElement('li');

        var textEl = document.createElement('span');
        textEl.className = 'bank-item-text';
        textEl.textContent = bank[index].text;

        var actions = document.createElement('span');
        actions.className = 'bank-item-actions';

        var editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '✎';
        editBtn.addEventListener('click', function () { openEditForm(index); });

        var removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function () { deleteQuestion(index); });

        actions.appendChild(editBtn);
        actions.appendChild(removeBtn);

        li.appendChild(textEl);
        li.appendChild(actions);
        bankList.appendChild(li);
      })(i);
    }
  }

  function deleteQuestion(index) {
    var ok = window.confirm('Eliminar esta pregunta del banco?');
    if (!ok) { return; }
    bank.splice(index, 1);
    saveBank();
    renderBankList();
    buildQueue();
    renderQuestion();
  }

  function setPickedCorrect(index) {
    pickedCorrect = index;
    var pills = correctPicker.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].className = (i === index) ? 'pill active' : 'pill';
    }
  }

  function openAddForm() {
    editingIndex = -1;
    editTitle.textContent = 'Nueva pregunta';
    editQuestionText.value = '';
    for (var i = 0; i < editOpts.length; i++) { editOpts[i].value = ''; }
    setPickedCorrect(0);
    editOverlay.className = 'result-overlay show';
  }

  function openEditForm(index) {
    editingIndex = index;
    var q = bank[index];
    editTitle.textContent = 'Editar pregunta';
    editQuestionText.value = q.text;
    for (var i = 0; i < editOpts.length; i++) {
      editOpts[i].value = q.options[i] !== undefined ? q.options[i] : '';
    }
    setPickedCorrect(q.correct);
    editOverlay.className = 'result-overlay show';
  }

  function closeEditForm() {
    editOverlay.className = 'result-overlay';
  }

  function trim(s) {
    return s.replace(/^\s+|\s+$/g, '');
  }

  function onSaveEdit() {
    var text = trim(editQuestionText.value);
    if (!text) {
      showToast('Escribi la pregunta');
      return;
    }

    var opt0 = trim(editOpts[0].value);
    var opt1 = trim(editOpts[1].value);
    var opt2 = trim(editOpts[2].value);
    var opt3 = trim(editOpts[3].value);

    if (!opt0 || !opt1) {
      showToast('Completa al menos 2 opciones');
      return;
    }
    if (opt3 && !opt2) {
      showToast('Completa la opcion 3 antes que la 4');
      return;
    }

    var options = [opt0, opt1];
    if (opt2) { options.push(opt2); }
    if (opt3) { options.push(opt3); }

    if (pickedCorrect >= options.length) {
      showToast('Elegi cual opcion es la correcta');
      return;
    }

    var question = { text: text, options: options, correct: pickedCorrect };

    if (editingIndex === -1) {
      bank.push(question);
    } else {
      bank[editingIndex] = question;
    }

    saveBank();
    renderBankList();
    buildQueue();
    renderQuestion();
    closeEditForm();
  }

  function onResetClick() {
    var ok = window.confirm('Restaurar el banco de preguntas por defecto?');
    if (!ok) { return; }
    bank = DEFAULT_BANK.slice(0);
    saveBank();
    renderBankList();
    buildQueue();
    renderQuestion();
    showToast('Preguntas restauradas');
  }

  function init() {
    bank = loadBank();
    buildQueue();
    renderQuestion();
    renderBankList();

    revealBtn.addEventListener('click', onRevealClick);
    nextBtn.addEventListener('click', onNextClick);
    addQuestionBtn.addEventListener('click', openAddForm);
    resetBtn.addEventListener('click', onResetClick);
    cancelEditBtn.addEventListener('click', closeEditForm);
    saveEditBtn.addEventListener('click', onSaveEdit);

    var pills = correctPicker.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].addEventListener('click', function (e) {
        setPickedCorrect(parseInt(e.currentTarget.getAttribute('data-index'), 10));
      });
    }
  }

  init();

})();
