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
    avgBefore: document.getElementById('avg-before'),
    avgAfter: document.getElementById('avg-after'),
    avgDiff: document.getElementById('avg-diff'),
    avgPct: document.getElementById('avg-pct'),
    eqAtkToMain: document.getElementById('eq-atk-to-main'),
    eqMainToSub: document.getElementById('eq-main-to-sub'),
  };

  function num(el, fallback = 0) {
    const val = parseFloat(el.value);
    return Number.isFinite(val) ? val : fallback;
  }

  function formatNum(value) {
    if (!Number.isFinite(value)) return '0';
    return value.toLocaleString('zh-TW', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function formatSigned(value) {
    if (!Number.isFinite(value) || Math.abs(value) < 1e-9) return '0';
    const prefix = value > 0 ? '+' : '';
    return prefix + formatNum(value);
  }

  function updateComparisonRow(beforeEl, afterEl, diffEl, pctEl, beforeVal, afterVal) {
    const diff = afterVal - beforeVal;
    const pct = beforeVal > 0 ? (diff / beforeVal) * 100 : 0;

    beforeEl.textContent = formatNum(beforeVal);
    afterEl.textContent = formatNum(afterVal);
    diffEl.textContent = `變化量：${formatSigned(diff)}`;

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

    const avgBefore = (minBefore + maxBefore) / 2;
    const avgAfter = (minAfter + maxAfter) / 2;

    updateComparisonRow(outputs.minBefore, outputs.minAfter, outputs.minDiff, outputs.minPct, minBefore, minAfter);
    updateComparisonRow(outputs.maxBefore, outputs.maxAfter, outputs.maxDiff, outputs.maxPct, maxBefore, maxAfter);
    updateComparisonRow(outputs.avgBefore, outputs.avgAfter, outputs.avgDiff, outputs.avgPct, avgBefore, avgAfter);

    // Marginal equivalence based on average range formula
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

  loadState();
  calculate();

  for (const el of Object.values(fields)) {
    el.addEventListener('input', () => {
      saveState();
      calculate();
    });
  }

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
      for (const [key, el] of Object.entries(fields)) {
        el.value = DEFAULTS[key];
      }
      saveState();
      calculate();
    });
  }
})();
