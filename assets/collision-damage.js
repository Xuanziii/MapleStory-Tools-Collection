(() => {
  const STORAGE_KEY = 'ms_tools_collision_v1';

  const DEFAULTS = {
    job: 'warrior',
    playerLv: '',
    playerDef: '',
    statStr: '',
    statDex: '',
    statInt: '',
    statLuk: '',
    mobLv: '',
    mobAtk: '',
    baseDef: '0',
  };

  const fields = {
    playerLv: document.getElementById('player-lv'),
    playerDef: document.getElementById('player-def'),
    statStr: document.getElementById('stat-str'),
    statDex: document.getElementById('stat-dex'),
    statInt: document.getElementById('stat-int'),
    statLuk: document.getElementById('stat-luk'),
    mobLv: document.getElementById('mob-lv'),
    mobAtk: document.getElementById('mob-atk'),
    baseDef: document.getElementById('base-def'),
  };

  const outputs = {
    range: document.getElementById('dmg-range'),
    note: document.getElementById('dmg-note'),
    min: document.getElementById('dmg-min'),
    max: document.getElementById('dmg-max'),
    coeffA: document.getElementById('coeff-a'),
    coeffB: document.getElementById('coeff-b'),
    coeffC: document.getElementById('coeff-c'),
    coeffD: document.getElementById('coeff-d'),
  };

  const jobButtons = document.querySelectorAll('.tab-btn[data-job]');
  let activeJob = DEFAULTS.job;

  function num(el, fallback = 0) {
    const val = parseFloat(el.value);
    return Number.isFinite(val) ? val : fallback;
  }

  function formatInt(val) {
    return Math.round(val).toLocaleString('zh-TW');
  }

  function saveState() {
    const data = { job: activeJob };
    for (const [key, el] of Object.entries(fields)) {
      data[key] = el.value;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }

  function applyJobUI() {
    jobButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.job === activeJob);
    });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        fields.baseDef.value = DEFAULTS.baseDef;
        applyJobUI();
        return;
      }
      const parsed = JSON.parse(raw);
      activeJob = parsed.job === 'other' ? 'other' : 'warrior';
      for (const [key, el] of Object.entries(fields)) {
        el.value = parsed[key] !== undefined ? parsed[key] : DEFAULTS[key];
      }
      applyJobUI();
    } catch {
      fields.baseDef.value = DEFAULTS.baseDef;
      applyJobUI();
    }
  }

  function calculate() {
    const playerLv = num(fields.playerLv, 0);
    const playerDef = num(fields.playerDef, 0);
    const str = num(fields.statStr, 0);
    const dex = num(fields.statDex, 0);
    const intStat = num(fields.statInt, 0);
    const luk = num(fields.statLuk, 0);
    const mobLv = num(fields.mobLv, 0);
    const mobAtk = num(fields.mobAtk, 0);
    const baseDef = num(fields.baseDef, 0);

    // D 係數
    const D = playerLv >= mobLv ? 13 / (13 + playerLv - mobLv) : 1.3;

    // C 係數
    const C =
      activeJob === 'warrior'
        ? str / 2800 + dex / 3200 + intStat / 7200 + luk / 3200
        : str / 2000 + dex / 2800 + intStat / 7200 + luk / 3200;

    // A 係數
    const A = C + 0.28;

    // B 係數
    const B =
      playerDef >= baseDef
        ? (C * 28) / 45 + (playerLv * 7) / 13000 + 0.196
        : D * (C + playerLv / 550 + 0.28);

    outputs.coeffA.textContent = A.toFixed(4);
    outputs.coeffB.textContent = B.toFixed(4);
    outputs.coeffC.textContent = C.toFixed(4);
    outputs.coeffD.textContent = D.toFixed(4);

    if (mobAtk <= 0 || playerLv <= 0 || mobLv <= 0) {
      outputs.range.textContent = '0 ～ 0';
      outputs.min.textContent = '0';
      outputs.max.textContent = '0';
      outputs.note.textContent = '請填入玩家等級、怪物等級與怪物物理攻擊';
      return;
    }

    const defReduction = playerDef * A + (playerDef - baseDef) * B;
    const rawMin = mobAtk * mobAtk * 0.008 - defReduction;
    const rawMax = mobAtk * mobAtk * 0.0085 - defReduction;

    const minDmg = Math.max(1, Math.round(rawMin));
    const maxDmg = Math.max(1, Math.round(rawMax));

    outputs.min.textContent = formatInt(minDmg);
    outputs.max.textContent = formatInt(maxDmg);
    outputs.range.textContent = `${formatInt(minDmg)} ～ ${formatInt(maxDmg)}`;

    if (rawMax < 1) {
      outputs.note.textContent = '防禦減傷已超過怪物攻擊傷害，實際受擊最低為 1';
    } else if (rawMin < 1) {
      outputs.note.textContent = '最小傷害低於 1，實際受擊最低為 1';
    } else {
      outputs.note.textContent =
        playerLv >= mobLv
          ? '玩家等級高於或等於怪物，已套用等級差減傷'
          : '玩家等級低於怪物，等級差係數 D 固定為 1.3';
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

  jobButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeJob = btn.dataset.job === 'other' ? 'other' : 'warrior';
      applyJobUI();
      saveState();
      calculate();
    });
  });

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeJob = DEFAULTS.job;
      applyJobUI();
      for (const [key, el] of Object.entries(fields)) {
        el.value = DEFAULTS[key];
      }
      saveState();
      calculate();
    });
  }
})();
