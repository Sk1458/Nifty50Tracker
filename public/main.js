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
  el.classList.remove('tag-bull', 'tag-bear', 'tag-neutral', 'tag-warn');
  if (/Bullish/i.test(text)) el.classList.add('tag-bull');
  else if (/Bearish/i.test(text)) el.classList.add('tag-bear');
  else if (/Risk|Volatility|Caution/i.test(text)) el.classList.add('tag-warn');
  else el.classList.add('tag-neutral');
}

async function loadData() {
  try {
    const res = await fetch('/api/nifty', { cache: 'no-store' });
    if (!res.ok) throw new Error('API error');
    const d = await res.json();
    els.symbol.textContent = d.symbol;
    els.price.textContent = d.currentPrice?.toFixed ? d.currentPrice.toFixed(2) : d.currentPrice;
    setBadge(els.maSignal, d.maPrediction);
    setBadge(els.riskLevel, d.riskLevel);

    els.ma10.textContent = d.ma.ma10;
    els.ma15.textContent = d.ma.ma15;
    els.ma20.textContent = d.ma.ma20;
    els.ma30.textContent = d.ma.ma30;
    els.ma50.textContent = d.ma.ma50;
    els.ma100.textContent = d.ma.ma100;

    els.vixValue.textContent = d.vix.value;
    els.vixPrediction.textContent = d.vix.prediction;

    els.pivot.textContent = d.pivotLevels.pivot;
    els.r1.textContent = d.pivotLevels.resistance1;
    els.r2.textContent = d.pivotLevels.resistance2;
    els.r3.textContent = d.pivotLevels.resistance3;
    els.s1.textContent = d.pivotLevels.support1;
    els.s2.textContent = d.pivotLevels.support2;
    els.s3.textContent = d.pivotLevels.support3;

    els.fib236.textContent = d.fibLevels.retracement.level236;
    els.fib382.textContent = d.fibLevels.retracement.level382;
    els.fib500.textContent = d.fibLevels.retracement.level500;
    els.fib618.textContent = d.fibLevels.retracement.level618;
    els.fib1272.textContent = d.fibLevels.extension.level1272;
    els.fib1618.textContent = d.fibLevels.extension.level1618;

    els.bbUpper.textContent = d.bollingerBands ? d.bollingerBands.upper : 'N/A';
    els.bbMiddle.textContent = d.bollingerBands ? d.bollingerBands.middle : 'N/A';
    els.bbLower.textContent = d.bollingerBands ? d.bollingerBands.lower : 'N/A';

    els.breakoutPrediction.textContent = d.breakoutPrediction.signal;
    els.breakoutLevel.textContent = d.breakoutPrediction.breakoutLevel;
    els.breakoutDirection.textContent = d.breakoutPrediction.direction;

    els.targetShort.textContent = d.upwardTargets.shortTerm;
    els.targetMedium.textContent = d.upwardTargets.mediumTerm;
    els.targetLong.textContent = d.upwardTargets.longTerm;
    els.nextResistance.textContent = d.nextZones.nextResistance;
    els.nextSupport.textContent = d.nextZones.nextSupport;

    els.marketTime.textContent = 'Market Time: ' + new Date(d.marketTime).toLocaleString();
    els.updatedTime.textContent = 'Updated: ' + new Date(d.serverTime).toLocaleString();
  } catch (e) {
    els.updatedTime.textContent = 'Error updating';
  }
}

els.refreshBtn.addEventListener('click', loadData);
loadData();
setInterval(loadData, 60 * 1000);


