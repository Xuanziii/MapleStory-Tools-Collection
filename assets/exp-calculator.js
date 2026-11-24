(() => {
  // 1 ~ 199 等升至下一級所需經驗值（索引 0 為 Lv.1 升至 Lv.2）
  const EXP_TO_NEXT = [
    15, 34, 57, 92, 135, 372, 560, 840, 1242, 1716,
    2360, 3216, 4200, 5460, 7050, 8840, 11040, 13716, 16680, 20216,
    24402, 28980, 34320, 40512, 47216, 54900, 63666, 73080, 83720, 95700,
    108480, 122760, 138666, 155540, 174216, 194832, 216600, 240500, 266682, 294216,
    324240, 356916, 391160, 428280, 468450, 510420, 555680, 604416, 655200, 709716,
    748608, 789631, 832902, 878545, 926689, 977471, 1031036, 1087536, 1147132, 1209994,
    1276301, 1346242, 1420016, 1497832, 1579913, 1666492, 1757815, 1854143, 1955750, 2062925,
    2175973, 2295216, 2420993, 2553663, 2693603, 2841212, 2996910, 3161140, 3334370, 3517093,
    3709829, 3913127, 4127566, 4353756, 4592341, 4844001, 5109452, 5389449, 5684790, 5996316,
    6324914, 6671519, 7037118, 7422752, 7829518, 8258575, 8711144, 9188514, 9692044, 10223168,
    10783397, 11374327, 11997640, 12655110, 13348610, 14080113, 14851703, 15665576, 16524049, 17429566,
    18384706, 19392187, 20454878, 21575805, 22758159, 24005306, 25320796, 26708375, 28171993, 29715818,
    31344244, 33061908, 34873700, 36784778, 38800583, 40926854, 43169645, 45535341, 48030677, 50662758,
    53439077, 56367538, 59456479, 62714694, 66151459, 69776558, 73600313, 77633610, 81887931, 86375389,
    91108760, 96101520, 101367883, 106922842, 112782213, 118962678, 125481832, 132358236, 139611467, 147262175,
    155332142, 163844343, 172823012, 182293713, 192283408, 202820538, 213935103, 225658746, 238024845, 251068606,
    264827165, 279339693, 294647508, 310794191, 327825712, 345790561, 364739883, 384727628, 405810702, 428049128,
    451506220, 476248760, 502347192, 529875818, 558913012, 589541445, 621848316, 655925603, 691870326, 729784819,
    769777027, 811960808, 856456260, 903390063, 952895838, 1005114529, 1060194805, 1118293480, 1179575962, 1244216724,
    1312399800, 1384319309, 1460180007, 1540197871, 1624600714, 1713628833, 1807535693, 1906588648, 2011069705,
  ];

  // 自行由升級需求累加計算 1 ~ 200 等總經驗（不依賴外部累計欄位）
  const TOTAL_EXP_TO_200 = EXP_TO_NEXT.reduce((sum, val) => sum + val, 0);

  function getExpBetween(fromLv, toLv) {
    let total = 0;
    for (let lv = fromLv; lv < toLv; lv += 1) {
      total += EXP_TO_NEXT[lv - 1] || 0;
    }
    return total;
  }

  function formatChineseExp(value) {
    const n = Math.max(0, Math.round(value));
    if (n === 0) return '0';
    const yi = Math.floor(n / 100000000);
    const wan = Math.floor((n % 100000000) / 10000);
    const rem = n % 10000;

    if (yi > 0) {
      return `${yi}億${String(wan).padStart(4, '0')}萬${String(rem).padStart(4, '0')}`;
    }
    if (wan > 0) {
      return `${wan}萬${String(rem).padStart(4, '0')}`;
    }
    return `${rem}`;
  }

  function formatDuration(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
      return '0 小時 0 分鐘';
    }
    const rounded = Math.ceil(totalMinutes);
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return `${hours.toLocaleString('zh-TW')} 小時 ${mins} 分鐘`;
  }

  function parseLevel(el) {
    const raw = el.value.trim();
    if (!raw) return null;
    const lv = parseInt(raw, 10);
    if (!Number.isFinite(lv) || lv < 1 || lv > 200) return null;
    return lv;
  }

  // 需求一：升級效率計算器
  const effCurrentLv = document.getElementById('eff-current-lv');
  const effTargetLv = document.getElementById('eff-target-lv');
  const effCurrentExp = document.getElementById('eff-current-exp');
  const effRate = document.getElementById('eff-rate');
  const effNeededExpEl = document.getElementById('eff-needed-exp');
  const effNeededTimeEl = document.getElementById('eff-needed-time');
  const effTimeNoteEl = document.getElementById('eff-time-note');
  const unitButtons = document.querySelectorAll('.unit-tab[data-unit]');

  let effUnit = '10min';

  function updateEfficiencyCalc() {
    const curLv = parseLevel(effCurrentLv);
    const tgtLv = parseLevel(effTargetLv);

    if (curLv === null || tgtLv === null) {
      effNeededExpEl.textContent = '0';
      effNeededTimeEl.textContent = '--';
      effTimeNoteEl.textContent = '請輸入 1 - 200 的當前與目標等級';
      return;
    }

    if (tgtLv <= curLv) {
      effNeededExpEl.textContent = '0';
      effNeededTimeEl.textContent = '--';
      effTimeNoteEl.textContent = '目標等級須大於當前等級';
      return;
    }

    const rawExp = parseFloat(effCurrentExp.value);
    const curExp = Number.isFinite(rawExp) && rawExp > 0 ? rawExp : 0;
    const totalNeeded = getExpBetween(curLv, tgtLv);
    const remaining = Math.max(0, totalNeeded - curExp);

    effNeededExpEl.textContent = formatChineseExp(remaining);

    if (remaining === 0) {
      effNeededTimeEl.textContent = '0 小時 0 分鐘';
      effTimeNoteEl.textContent = '當前經驗值已達目標等級需求';
      return;
    }

    const rate = parseFloat(effRate.value);
    if (!Number.isFinite(rate) || rate <= 0) {
      effNeededTimeEl.textContent = '--';
      effTimeNoteEl.textContent = '請輸入大於 0 的經驗效率';
      return;
    }

    let expPerMin = rate;
    if (effUnit === '10min') expPerMin = rate / 10;
    if (effUnit === 'hour') expPerMin = rate / 60;

    const totalMinutes = remaining / expPerMin;
    effNeededTimeEl.textContent = formatDuration(totalMinutes);

    const days = totalMinutes / (60 * 24);
    effTimeNoteEl.textContent =
      days >= 1
        ? `換算約 ${days.toFixed(1)} 天（以目前效率持續練功）`
        : '以目前效率持續練功預估';
  }

  [effCurrentLv, effTargetLv, effCurrentExp, effRate].forEach((el) => {
    el.addEventListener('input', updateEfficiencyCalc);
  });

  unitButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      effUnit = btn.dataset.unit;
      unitButtons.forEach((b) => b.classList.toggle('active', b === btn));
      updateEfficiencyCalc();
    });
  });

  // 需求二：簡易經驗需求計算器
  const simpleCurrentLv = document.getElementById('simple-current-lv');
  const simpleTargetLv = document.getElementById('simple-target-lv');
  const simpleNeededExpEl = document.getElementById('simple-needed-exp');
  const simpleNoteEl = document.getElementById('simple-note');

  function updateSimpleCalc() {
    const curLv = parseLevel(simpleCurrentLv);
    const tgtLv = parseLevel(simpleTargetLv);

    if (curLv === null || tgtLv === null) {
      simpleNeededExpEl.textContent = '0';
      simpleNoteEl.textContent = '請輸入 1 - 200 的當前與目標等級';
      return;
    }

    if (tgtLv <= curLv) {
      simpleNeededExpEl.textContent = '0';
      simpleNoteEl.textContent = '目標等級須大於當前等級';
      return;
    }

    const totalNeeded = getExpBetween(curLv, tgtLv);
    simpleNeededExpEl.textContent = formatChineseExp(totalNeeded);
    simpleNoteEl.textContent = `從 Lv.${curLv} 升至 Lv.${tgtLv} 共需經驗值`;
  }

  [simpleCurrentLv, simpleTargetLv].forEach((el) => {
    el.addEventListener('input', updateSimpleCalc);
  });

  // 需求三：200 等達成進度娛樂項目
  const milestoneLvInput = document.getElementById('milestone-lv-input');
  const milestonePctEl = document.getElementById('milestone-pct');
  const milestoneFillEl = document.getElementById('milestone-progress-fill');
  const milestoneSlider = document.getElementById('milestone-slider');

  function renderMilestone(lv) {
    const clamped = Math.min(200, Math.max(1, lv));
    const cumExp = getExpBetween(1, clamped);
    const pct = (cumExp / TOTAL_EXP_TO_200) * 100;
    milestonePctEl.textContent = `${pct.toFixed(2)}%`;
    milestoneFillEl.style.width = `${pct.toFixed(2)}%`;
  }

  milestoneSlider.addEventListener('input', () => {
    const lv = parseInt(milestoneSlider.value, 10) || 1;
    milestoneLvInput.value = String(lv);
    renderMilestone(lv);
  });

  milestoneLvInput.addEventListener('input', () => {
    const raw = milestoneLvInput.value.trim();
    if (!raw) {
      milestonePctEl.textContent = '0.00%';
      milestoneFillEl.style.width = '0%';
      return;
    }
    const lv = parseInt(raw, 10);
    if (!Number.isFinite(lv)) return;
    const clamped = Math.min(200, Math.max(1, lv));
    milestoneSlider.value = String(clamped);
    renderMilestone(clamped);
  });

  milestoneLvInput.addEventListener('blur', () => {
    const lv = parseInt(milestoneLvInput.value, 10);
    const clamped = Number.isFinite(lv) ? Math.min(200, Math.max(1, lv)) : 1;
    milestoneLvInput.value = String(clamped);
    milestoneSlider.value = String(clamped);
    renderMilestone(clamped);
  });

  // 初始化計算
  updateEfficiencyCalc();
  updateSimpleCalc();
  renderMilestone(1);
})();
