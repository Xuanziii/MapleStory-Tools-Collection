(() => {
  const STORAGE_KEY = 'ms_tools_gear_gain_v1';

  const DEFAULTS = {
    mainStat: '',
    subStat: '',
    totalAtk: '',
    mastery: '0.6',
    minCoeff: '',
    maxCoeff: '',
    addMain: '',
    addSub: '',
    addAtk: '',
  };

  const WEAPON_DATA = {
    artale: [
      { name: '單手劍', min: 4.2, max: 4.2 },
      { name: '雙手劍', min: 4.8, max: 4.8 },
      { name: '單手斧', min: 3.6, max: 4.8 },
      { name: '單手棍', min: 3.6, max: 4.8 },
      { name: '雙手斧', min: 4, max: 5.2 },
      { name: '雙手棍', min: 4, max: 5.2 },
      { name: '矛', min: 3.5, max: 5.2 },
      { name: '槍', min: 3.6, max: 5.1 },
      { name: '短刀', min: 3.6, max: 4.2 },
      { name: '拳套', min: 3.6, max: 3.6 },
      { name: '弓', min: 3.4, max: 3.4 },
      { name: '弩', min: 3.6, max: 3.6 },
      { name: '指虎', min: 4.8, max: 4.8 },
      { name: '火槍', min: 3.6, max: 3.6 },
    ],
    classic: [
      { name: '單手劍', min: 4, max: 4 },
      { name: '雙手劍', min: 4.6, max: 4.6 },
      { name: '單手斧', min: 3.2, max: 4.4 },
      { name: '單手棍', min: 3.2, max: 4.4 },
      { name: '雙手斧', min: 3.4, max: 4.8 },
      { name: '雙手棍', min: 3.4, max: 4.8 },
      { name: '矛', min: 3, max: 5 },
      { name: '槍', min: 3, max: 5 },
      { name: '短刀', min: 3.6, max: 3.6 },
      { name: '拳套', min: 3.6, max: 3.6 },
      { name: '弓', min: 3.4, max: 3.4 },
      { name: '弩', min: 3.6, max: 3.6 },
      { name: '指虎', min: 4.8, max: 4.8 },
      { name: '火槍', min: 3.6, max: 3.6 },
    ],
    modern: [
      { name: '單手劍', min: 0, max: 4 },
      { name: '雙手劍', min: 0, max: 5 },
      { name: '單手斧', min: 0, max: 4.4 },
      { name: '單手棍', min: 0, max: 4.4 },
      { name: '雙手斧', min: 0, max: 5 },
      { name: '雙手棍', min: 0, max: 5 },
      { name: '矛', min: 0, max: 5 },
      { name: '槍', min: 0, max: 5 },
      { name: '短刀', min: 0, max: 5 },
      { name: '拳套', min: 0, max: 5 },
      { name: '弓', min: 0, max: 4.6 },
      { name: '弩', min: 0, max: 4.6 },
      { name: '指虎', min: 4.5, max: 5 },
      { name: '火槍', min: 0, max: 4.6 },
    ],
  };

  const fields = {
    mainStat: document.getElementById('main-stat'),
    subStat: document.getElementById('sub-stat'),
    totalAtk: document.getElementById('total-atk'),
    mastery: document.getElementById('mastery'),
    minCoeff: document.getElementById('min-coeff'),
    maxCoeff: document.getElementById('max-coeff'),
    addMain: document.getElementById('add-main'),
    addSub: document.getElementById('add-sub'),
    addAtk: document.getElementById('add-atk'),
  };

  const outputs = {
    minBefore: document.getElementById('min-before'),
    minAfter: document.getElementById('min-after'),
    minDiff: document.getElementById('min-diff'),
    minPct: document.getElementById('min-pct'),
    maxBefore: document.getElementById('max-before'),
    maxAfter: document.getElementById('max-after'),
    maxDiff: document.getElementById('max-diff'),
    maxPct: document.getElementById('max-pct'),
    eqAtkToMain: document.getElementById('eq-atk-to-main'),
    eqMainToSub: document.getElementById('eq-main-to-sub'),
  };

  let activeVersion = 'artale';
  let selectedWeaponName = null;

  function num(el, fallback = 0) {
    const val = parseFloat(el.value);
    return Number.isFinite(val) ? val : fallback;
  }

  function splitFormattedNumber(value, signed = false) {
    if (!Number.isFinite(value) || Math.abs(value) < 1e-9) {
      return { intPart: '0', decPart: '' };
    }
    const prefix = signed && value > 0 ? '+' : value < 0 ? '-' : '';
    const abs = Math.abs(value);
    const fixed = abs.toFixed(2);
    const [rawInt, rawDec] = fixed.split('.');
    const intFormatted = Number(rawInt).toLocaleString('zh-TW');
    const trimmedDec = rawDec.replace(/0+$/, '');
    return {
      intPart: prefix + intFormatted,
      decPart: trimmedDec ? `.${trimmedDec}` : '',
    };
  }

  function renderNumber(el, value, signed = false, labelPrefix = '') {
    const { intPart, decPart } = splitFormattedNumber(value, signed);
    el.textContent = '';
    if (labelPrefix) {
      el.appendChild(document.createTextNode(labelPrefix));
    }
    el.appendChild(document.createTextNode(intPart));
    if (decPart) {
      const decSpan = document.createElement('span');
      decSpan.className = 'num-dec';
      decSpan.textContent = decPart;
      el.appendChild(decSpan);
    }
  }

  function updateComparisonRow(beforeEl, afterEl, diffEl, pctEl, beforeVal, afterVal) {
    const diff = afterVal - beforeVal;
    const pct = beforeVal > 0 ? (diff / beforeVal) * 100 : 0;

    renderNumber(beforeEl, beforeVal, false);
    renderNumber(afterEl, afterVal, false);
    renderNumber(diffEl, diff, true, '變化量：');

    pctEl.classList.remove('positive', 'negative');
    if (diff > 1e-9) {
      pctEl.classList.add('positive');
      pctEl.textContent = `+${pct.toFixed(2)}%`;
    } else if (diff < -1e-9) {
      pctEl.classList.add('negative');
      pctEl.textContent = `${pct.toFixed(2)}%`;
    } else {
      pctEl.textContent = '0.00%';
    }
  }

  function calcMin(main, sub, atk, minCoeff, mastery) {
    return ((main * minCoeff * mastery) + sub) * atk / 100;
  }

  function calcMax(main, sub, atk, maxCoeff) {
    return ((main * maxCoeff) + sub) * atk / 100;
  }

  function saveState() {
    const data = {};
    for (const [key, el] of Object.entries(fields)) {
      data[key] = el.value;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        fields.mastery.value = DEFAULTS.mastery;
        return;
      }
      const parsed = JSON.parse(raw);
      for (const [key, el] of Object.entries(fields)) {
        el.value = parsed[key] !== undefined ? parsed[key] : DEFAULTS[key];
      }
    } catch {
      fields.mastery.value = DEFAULTS.mastery;
    }
  }

  function calculate() {
    const main = num(fields.mainStat, 0);
    const sub = num(fields.subStat, 0);
    const atk = num(fields.totalAtk, 0);
    const mastery = num(fields.mastery, 0.6);
    const minCoeff = num(fields.minCoeff, 0);
    const maxCoeff = num(fields.maxCoeff, 0);

    const addMain = num(fields.addMain, 0);
    const addSub = num(fields.addSub, 0);
    const addAtk = num(fields.addAtk, 0);

    const nextMain = Math.max(0, main + addMain);
    const nextSub = Math.max(0, sub + addSub);
    const nextAtk = Math.max(0, atk + addAtk);

    const minBefore = calcMin(main, sub, atk, minCoeff, mastery);
    const minAfter = calcMin(nextMain, nextSub, nextAtk, minCoeff, mastery);

    const maxBefore = calcMax(main, sub, atk, maxCoeff);
    const maxAfter = calcMax(nextMain, nextSub, nextAtk, maxCoeff);

    updateComparisonRow(outputs.minBefore, outputs.minAfter, outputs.minDiff, outputs.minPct, minBefore, minAfter);
    updateComparisonRow(outputs.maxBefore, outputs.maxAfter, outputs.maxDiff, outputs.maxPct, maxBefore, maxAfter);

    const avgCoeff = ((minCoeff * mastery) + maxCoeff) / 2;
    if (atk > 0 && avgCoeff > 0 && (main * avgCoeff + sub) > 0) {
      const atkPerMain = (main * avgCoeff + sub) / (atk * avgCoeff);
      outputs.eqAtkToMain.textContent = `${atkPerMain.toFixed(2)} 主屬性`;
      outputs.eqMainToSub.textContent = `${avgCoeff.toFixed(2)} 副屬性`;
    } else {
      outputs.eqAtkToMain.textContent = '-- 主屬性';
      outputs.eqMainToSub.textContent = '-- 副屬性';
    }
  }

  function flashCoeffInputs() {
    [fields.minCoeff, fields.maxCoeff].forEach((input) => {
      input.classList.remove('input-flash');
      void input.offsetWidth;
      input.classList.add('input-flash');
      setTimeout(() => input.classList.remove('input-flash'), 450);
    });
  }

  function renderWeaponTable() {
    const tbody = document.getElementById('weapon-table-body');
    if (!tbody) return;

    const rows = WEAPON_DATA[activeVersion] || [];
    tbody.textContent = '';

    rows.forEach((weapon) => {
      const tr = document.createElement('tr');
      if (selectedWeaponName === weapon.name) {
        tr.classList.add('selected');
      }

      const tdName = document.createElement('td');
      tdName.textContent = weapon.name;

      const tdMin = document.createElement('td');
      tdMin.textContent = String(weapon.min);
      if (weapon.min === 0) {
        tdMin.classList.add('coeff-zero');
      }

      const tdMax = document.createElement('td');
      tdMax.textContent = String(weapon.max);

      tr.appendChild(tdName);
      tr.appendChild(tdMin);
      tr.appendChild(tdMax);

      tr.addEventListener('click', () => {
        selectedWeaponName = weapon.name;
        fields.minCoeff.value = String(weapon.min);
        fields.maxCoeff.value = String(weapon.max);
        saveState();
        calculate();
        renderWeaponTable();
        flashCoeffInputs();
      });

      tbody.appendChild(tr);
    });
  }

  loadState();
  calculate();
  renderWeaponTable();

  for (const el of Object.values(fields)) {
    el.addEventListener('input', () => {
      if (el === fields.minCoeff || el === fields.maxCoeff) {
        selectedWeaponName = null;
        renderWeaponTable();
      }
      saveState();
      calculate();
    });
  }

  const tabButtons = document.querySelectorAll('.tab-btn[data-version]');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeVersion = btn.dataset.version;
      selectedWeaponName = null;
      tabButtons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      });
      renderWeaponTable();
    });
  });

  const resetAddBtn = document.getElementById('reset-add-btn');
  if (resetAddBtn) {
    resetAddBtn.addEventListener('click', () => {
      fields.addMain.value = '';
      fields.addSub.value = '';
      fields.addAtk.value = '';
      saveState();
      calculate();
    });
  }

  const resetAllBtn = document.getElementById('reset-all-btn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      selectedWeaponName = null;
      for (const [key, el] of Object.entries(fields)) {
        el.value = DEFAULTS[key];
      }
      saveState();
      calculate();
      renderWeaponTable();
    });
  }
})();
