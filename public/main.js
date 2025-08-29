const els = {
  symbol: document.getElementById('symbol'),
  price: document.getElementById('price'),
  maSignal: document.getElementById('maSignal'),
  riskLevel: document.getElementById('riskLevel'),
  ma10: document.getElementById('ma10'),
  ma15: document.getElementById('ma15'),
  ma20: document.getElementById('ma20'),
  ma30: document.getElementById('ma30'),
  ma50: document.getElementById('ma50'),
  ma100: document.getElementById('ma100'),
  vixValue: document.getElementById('vixValue'),
  vixPrediction: document.getElementById('vixPrediction'),
  pivot: document.getElementById('pivot'),
  r1: document.getElementById('r1'),
  r2: document.getElementById('r2'),
  r3: document.getElementById('r3'),
  s1: document.getElementById('s1'),
  s2: document.getElementById('s2'),
  s3: document.getElementById('s3'),
  fib236: document.getElementById('fib236'),
  fib382: document.getElementById('fib382'),
  fib500: document.getElementById('fib500'),
  fib618: document.getElementById('fib618'),
  fib1272: document.getElementById('fib1272'),
  fib1618: document.getElementById('fib1618'),
  bbUpper: document.getElementById('bbUpper'),
  bbMiddle: document.getElementById('bbMiddle'),
  bbLower: document.getElementById('bbLower'),
  breakoutPrediction: document.getElementById('breakoutPrediction'),
  breakoutLevel: document.getElementById('breakoutLevel'),
  breakoutDirection: document.getElementById('breakoutDirection'),
  targetShort: document.getElementById('targetShort'),
  targetMedium: document.getElementById('targetMedium'),
  targetLong: document.getElementById('targetLong'),
  nextResistance: document.getElementById('nextResistance'),
  nextSupport: document.getElementById('nextSupport'),
  marketTime: document.getElementById('marketTime'),
  updatedTime: document.getElementById('updatedTime'),
  refreshBtn: document.getElementById('refreshBtn')
};

function setBadge(el, text) {
  el.textContent = text;
  el.classList.remove('badge', 'tag-bull', 'tag-bear', 'tag-neutral', 'tag-warn', 'bull', 'bear', 'neutral', 'warn');
  el.classList.add('badge');
  if (/Bullish|Positive|Up/i.test(text)) el.classList.add('bull', 'tag-bull');
  else if (/Bearish|Negative|Down/i.test(text)) el.classList.add('bear', 'tag-bear');
  else if (/Risk|Volatility|Caution|Warn/i.test(text)) el.classList.add('warn', 'tag-warn');
  else el.classList.add('neutral', 'tag-neutral');
}

function setPosNeg(el, value, compareTo) {
  if (!el) return;
  el.classList.remove('pos', 'neg');
  if (typeof value === 'number' && typeof compareTo === 'number') {
    if (value > compareTo) el.classList.add('pos');
    else if (value < compareTo) el.classList.add('neg');
  }
}

function setIndicator(el, type, signal) {
  // el is the wrapper span with class "indicator"
  const textEl = el.querySelector('.text');
  const dotEl = el.querySelector('.dot');
  textEl.textContent = signal || '--';
  const classesToRemove = ['bull','bear','neutral','warn','ema','sma','vwap','volume','macd','rsi','overbought','oversold','doji'];
  el.classList.remove(...classesToRemove);
  // Apply type-specific style first
  if (type) el.classList.add(type);
  // Apply sentiment overlay
  if (/bull|up|long|breakout up/i.test(signal)) el.classList.add('bull');
  else if (/bear|down|short|breakdown/i.test(signal)) el.classList.add('bear');
  else if (/warn|caution/i.test(signal)) el.classList.add('warn');
  else el.classList.add('neutral');
  // RSI nuances
  if (/overbought/i.test(signal)) { el.classList.add('rsi','overbought'); }
  if (/oversold/i.test(signal)) { el.classList.add('rsi','oversold'); }
  // keep dot node for visual pulse in future if needed
  if (dotEl) dotEl.style.opacity = '1';
}

async function loadData() {
  try {
    const res = await fetch('/api/nifty', { cache: 'no-store' });
    if (!res.ok) throw new Error('API error');
    const d = await res.json();
    els.symbol.textContent = d.symbol;
    els.price.textContent = d.currentPrice?.toFixed ? d.currentPrice.toFixed(2) : d.currentPrice;
    els.price.classList.remove('up', 'down', 'flat');
    if (typeof d.change === 'number') {
      if (d.change > 0) els.price.classList.add('up');
      else if (d.change < 0) els.price.classList.add('down');
      else els.price.classList.add('flat');
    } else if (typeof d.percentChange === 'number') { // fallback
      if (d.percentChange > 0) els.price.classList.add('up');
      else if (d.percentChange < 0) els.price.classList.add('down');
      else els.price.classList.add('flat');
    }
    setBadge(els.maSignal, d.maPrediction || d.signal || 'Neutral');
    setBadge(els.riskLevel, d.riskLevel || d.vix?.prediction || 'Neutral');

    els.ma10.textContent = d.ma.ma10;
    els.ma15.textContent = d.ma.ma15;
    els.ma20.textContent = d.ma.ma20;
    els.ma30.textContent = d.ma.ma30;
    els.ma50.textContent = d.ma.ma50;
    els.ma100.textContent = d.ma.ma100;

    els.vixValue.textContent = d.vix.value;
    els.vixPrediction.textContent = d.vix.prediction;
    // Colorize VIX value: <15 green (stable), 15–20 amber (moderate), >20 red (unstable)
    if (d.vix && typeof d.vix.value === 'number') {
      els.vixValue.classList.remove('pos','neg','warn');
      const vix = d.vix.value;
      if (vix < 15) els.vixValue.classList.add('pos');
      else if (vix <= 20) els.vixValue.classList.add('warn');
      else els.vixValue.classList.add('neg');
    }

    els.pivot.textContent = d.pivotLevels.pivot;
    els.r1.textContent = d.pivotLevels.resistance1;
    els.r2.textContent = d.pivotLevels.resistance2;
    els.r3.textContent = d.pivotLevels.resistance3;
    els.s1.textContent = d.pivotLevels.support1;
    els.s2.textContent = d.pivotLevels.support2;
    els.s3.textContent = d.pivotLevels.support3;
    // Colorize pivot family: resistances = bear, supports = bull
    [els.r1, els.r2, els.r3].forEach(el => { if (el) { el.classList.remove('pos','neg'); el.classList.add('neg'); } });
    [els.s1, els.s2, els.s3].forEach(el => { if (el) { el.classList.remove('pos','neg'); el.classList.add('pos'); } });

    els.fib236.textContent = d.fibLevels.retracement.level236;
    els.fib382.textContent = d.fibLevels.retracement.level382;
    els.fib500.textContent = d.fibLevels.retracement.level500;
    els.fib618.textContent = d.fibLevels.retracement.level618;
    els.fib1272.textContent = d.fibLevels.extension.level1272;
    els.fib1618.textContent = d.fibLevels.extension.level1618;

    els.bbUpper.textContent = d.bollingerBands ? d.bollingerBands.upper : 'N/A';
    els.bbMiddle.textContent = d.bollingerBands ? d.bollingerBands.middle : 'N/A';
    els.bbLower.textContent = d.bollingerBands ? d.bollingerBands.lower : 'N/A';
    // Colorize Bollinger: upper = bear, lower = bull
    if (d.bollingerBands) {
      if (els.bbUpper) { els.bbUpper.classList.remove('pos','neg'); els.bbUpper.classList.add('neg'); }
      if (els.bbLower) { els.bbLower.classList.remove('pos','neg'); els.bbLower.classList.add('pos'); }
    }

    els.breakoutPrediction.textContent = d.breakoutPrediction.signal;
    els.breakoutLevel.textContent = d.breakoutPrediction.breakoutLevel;
    setIndicator(els.breakoutDirection, 'vwap', d.breakoutPrediction.direction);

    // Colorize MA values relative to current price
    setPosNeg(els.ma10, d.ma.ma10, d.currentPrice);
    setPosNeg(els.ma15, d.ma.ma15, d.currentPrice);
    setPosNeg(els.ma20, d.ma.ma20, d.currentPrice);
    setPosNeg(els.ma30, d.ma.ma30, d.currentPrice);
    setPosNeg(els.ma50, d.ma.ma50, d.currentPrice);
    setPosNeg(els.ma100, d.ma.ma100, d.currentPrice);

    els.targetShort.textContent = d.upwardTargets.shortTerm;
    els.targetMedium.textContent = d.upwardTargets.mediumTerm;
    els.targetLong.textContent = d.upwardTargets.longTerm;
    els.nextResistance.textContent = d.nextZones.nextResistance;
    els.nextSupport.textContent = d.nextZones.nextSupport;
    if (els.nextResistance) { els.nextResistance.classList.remove('pos','neg'); els.nextResistance.classList.add('neg'); }
    if (els.nextSupport) { els.nextSupport.classList.remove('pos','neg'); els.nextSupport.classList.add('pos'); }

    els.marketTime.textContent = 'Market Time: ' + new Date(d.marketTime).toLocaleString();
    els.updatedTime.textContent = 'Updated: ' + new Date(d.serverTime).toLocaleString();
    // Emphasize VIX prediction risk
    if (els.vixPrediction) {
      els.vixPrediction.classList.remove('warn');
      if (/High|Extreme/i.test(d.vix.prediction)) els.vixPrediction.classList.add('warn');
    }
  } catch (e) {
    els.updatedTime.textContent = 'Error updating';
  }
}

els.refreshBtn.addEventListener('click', loadData);
loadData();
setInterval(loadData, 60 * 1000);


