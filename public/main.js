const els = {
  symbol: document.getElementById('symbol'),
  price: document.getElementById('price'),
  maSignal: document.getElementById('maSignal'),
  riskLevel: document.getElementById('riskLevel'),
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
  refreshBtn: document.getElementById('refreshBtn'),
  autoRefreshBtn: document.getElementById('autoRefreshBtn')
};

// Remove all holiday/weekend/market hour logic and set a fixed 30s refresh
let refreshInterval = null;
let isAutoRefreshEnabled = false;
let consecutiveFailures = 0;
const FIXED_REFRESH_RATE = 30 * 1000; // 30 seconds

function startAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(() => {
    loadData();
  }, FIXED_REFRESH_RATE);
  isAutoRefreshEnabled = true;
  updateAutoRefreshButton();
  console.log(`Auto-refresh started: 30 seconds (fixed)`);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  isAutoRefreshEnabled = false;
  updateAutoRefreshButton();
  console.log('Auto-refresh stopped');
}

function toggleAutoRefresh() {
  if (isAutoRefreshEnabled) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
}

function updateAutoRefreshButton() {
  const btn = els.autoRefreshBtn;
  if (btn) {
    btn.textContent = `Auto-Refresh: ${isAutoRefreshEnabled ? 'ON' : 'OFF'} (30s)`;
    btn.classList.remove('secondary', 'bull');
    if (isAutoRefreshEnabled) {
      btn.classList.add('bull');
    } else {
      btn.classList.add('secondary');
    }
  }
}

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

function arrangeMovingAverages(maData, currentPrice) {
  console.log('arrangeMovingAverages called with:', { maData, currentPrice });
  
  const maAbove = document.getElementById('maAbove');
  const maBelow = document.getElementById('maBelow');
  
  if (!maAbove || !maBelow) {
    console.error('MA containers not found:', { maAbove, maBelow });
    return;
  }
  
  // Clear existing content
  maAbove.innerHTML = '';
  maBelow.innerHTML = '';
  
  // Define MA periods and their labels
  const maPeriods = [
    { key: 'ma10', label: 'MA 10' },
    { key: 'ma15', label: 'MA 15' },
    { key: 'ma20', label: 'MA 20' },
    { key: 'ma30', label: 'MA 30' },
    { key: 'ma50', label: 'MA 50' },
    { key: 'ma100', label: 'MA 100' }
  ];
  
  // Sort MAs by value (descending for above, ascending for below)
  const maAboveList = [];
  const maBelowList = [];
  
  maPeriods.forEach(period => {
    const value = maData[period.key];
    console.log(`Processing ${period.label}:`, { key: period.key, value, currentPrice });
    if (value && typeof value === 'number') {
      if (value > currentPrice) {
        maAboveList.push({ ...period, value });
        console.log(`Added ${period.label} to above list`);
      } else if (value < currentPrice) {
        maBelowList.push({ ...period, value });
        console.log(`Added ${period.label} to below list`);
      }
    }
  });
  
  console.log('MA lists:', { maAboveList, maBelowList });
  
  // Sort above MAs in descending order (highest at top)
  maAboveList.sort((a, b) => b.value - a.value);
  
  // Sort below MAs in ascending order (lowest at top)
  maBelowList.sort((a, b) => a.value - b.value);
  
  // Create MA items for above
  maAboveList.forEach(ma => {
    const maItem = document.createElement('div');
    maItem.className = 'ma-item';
    maItem.innerHTML = `
      <span class="ma-label">${ma.label}</span>
      <span class="ma-value">${ma.value.toFixed(2)}</span>
    `;
    maAbove.appendChild(maItem);
  });
  
  // Create MA items for below
  maBelowList.forEach(ma => {
    const maItem = document.createElement('div');
    maItem.className = 'ma-item';
    maItem.innerHTML = `
      <span class="ma-label">${ma.label}</span>
      <span class="ma-value">${ma.value.toFixed(2)}</span>
    `;
    maBelow.appendChild(maItem);
  });
  
  // Add placeholder text if containers are empty
  if (maAboveList.length === 0) {
    maAbove.innerHTML = '<div style="text-align: center; color: var(--muted); padding: 20px;">No MAs above current price</div>';
  }
  
  if (maBelowList.length === 0) {
    maBelow.innerHTML = '<div style="text-align: center; color: var(--muted); padding: 20px;">No MAs below current price</div>';
  }
  
  console.log('MA arrangement completed');
}

// Enhanced loadData with error handling
async function loadData() {
  try {
    const res = await fetch('/api/nifty', { cache: 'no-store' });
    
    if (!res.ok) {
      if (res.status === 429) { // Rate limited
        console.warn('Rate limited, backing off...');
        consecutiveFailures++;
        
        if (consecutiveFailures >= 3) {
          // Back off for 5 minutes
          stopAutoRefresh();
          setTimeout(() => {
            consecutiveFailures = 0;
            if (isAutoRefreshEnabled) {
              startAutoRefresh();
            }
          }, 5 * 60 * 1000);
          
          els.updatedTime.textContent = 'Rate limited - Auto-refresh paused for 5 minutes';
          return;
        }
      }
      throw new Error(`API error: ${res.status}`);
    }
    
    // Reset failure count on success
    consecutiveFailures = 0;
    
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

    // Arrange MAs dynamically around the current price
    if (d.ma && d.currentPrice) {
      arrangeMovingAverages(d.ma, d.currentPrice);
    }

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
    console.error('Error loading data:', e);
    consecutiveFailures++;
    els.updatedTime.textContent = `Error updating (${consecutiveFailures} failures)`;
    
    // If too many failures, back off
    if (consecutiveFailures >= 5) {
      stopAutoRefresh();
      setTimeout(() => {
        consecutiveFailures = 0;
        if (isAutoRefreshEnabled) {
          startAutoRefresh();
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
  }
}

// Initialize the refresh system
function initializeRefreshSystem() {
  if (els.autoRefreshBtn) {
    els.autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
  }
  if (els.refreshBtn) {
    els.refreshBtn.addEventListener('click', loadData);
  }
  startAutoRefresh();
  // No need for periodic rate checks or holiday updates
}

// Initialize everything
loadData();
initializeRefreshSystem();