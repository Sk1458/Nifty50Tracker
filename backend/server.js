import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());
// Serve static with conservative caching to avoid stale assets during development
app.use(express.static('public', {
  etag: true,
  lastModified: true,
  maxAge: 0,
  setHeaders: (res, path) => {
    if (path.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

const SYMBOL = '^NSEI';
const VIX_SYMBOL = '^INDIAVIX';

// ===== Helper calculations (ported from Apps Script) =====
function calculateMA(data, windowSize) {
  const ma = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += data[i - j];
    }
    ma.push(parseFloat((sum / windowSize).toFixed(2)));
  }
  return ma;
}

function generatePrediction(ma15, ma50) {
  const lastMA15 = ma15[ma15.length - 1];
  const lastMA50 = ma50[ma50.length - 1];
  const prevMA15 = ma15.length > 1 ? ma15[ma15.length - 2] : lastMA15;
  const prevMA50 = ma50.length > 1 ? ma50[ma50.length - 2] : lastMA50;
  let signal = 'Neutral';
  if (lastMA15 > lastMA50 && prevMA15 <= prevMA50) signal = 'Bullish (Buy)';
  else if (lastMA15 < lastMA50 && prevMA15 >= prevMA50) signal = 'Bearish (Sell)';
  return { signal };
}

function generateVixPrediction(vixValue) {
  if (vixValue < 15) return 'Low Volatility (Stable Market)';
  if (vixValue < 20) return 'Moderate Volatility (Normal Conditions)';
  if (vixValue < 25) return 'High Volatility (Caution Advised)';
  return 'Extreme Volatility (Market Stress)';
}

function calculatePivotPoints(high, low, close) {
  const pivot = (high + low + close) / 3;
  const r1 = (2 * pivot) - low;
  const r2 = pivot + (high - low);
  const r3 = high + (2 * (pivot - low));
  const s1 = (2 * pivot) - high;
  const s2 = pivot - (high - low);
  const s3 = low - (2 * (high - pivot));
  return {
    pivot: parseFloat(pivot.toFixed(2)),
    resistance1: parseFloat(r1.toFixed(2)),
    resistance2: parseFloat(r2.toFixed(2)),
    resistance3: parseFloat(r3.toFixed(2)),
    support1: parseFloat(s1.toFixed(2)),
    support2: parseFloat(s2.toFixed(2)),
    support3: parseFloat(s3.toFixed(2))
  };
}

function calculateFibonacciLevels(high, low) {
  const range = high - low;
  const fib236 = high - (range * 0.236);
  const fib382 = high - (range * 0.382);
  const fib500 = high - (range * 0.5);
  const fib618 = high - (range * 0.618);
  const fib786 = high - (range * 0.786);
  const ext1272 = high + (range * 0.272);
  const ext1414 = high + (range * 0.414);
  const ext1618 = high + (range * 1.618);
  return {
    retracement: {
      level236: parseFloat(fib236.toFixed(2)),
      level382: parseFloat(fib382.toFixed(2)),
      level500: parseFloat(fib500.toFixed(2)),
      level618: parseFloat(fib618.toFixed(2)),
      level786: parseFloat(fib786.toFixed(2))
    },
    extension: {
      level1272: parseFloat(ext1272.toFixed(2)),
      level1414: parseFloat(ext1414.toFixed(2)),
      level1618: parseFloat(ext1618.toFixed(2))
    }
  };
}

function calculateBollingerBands(closes, period = 20, multiplier = 2) {
  if (closes.length < period) return null;
  const recent = closes.slice(-period);
  const sma = recent.reduce((sum, price) => sum + price, 0) / period;
  const variance = recent.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const upperBand = sma + (multiplier * stdDev);
  const lowerBand = sma - (multiplier * stdDev);
  return { middle: parseFloat(sma.toFixed(2)), upper: parseFloat(upperBand.toFixed(2)), lower: parseFloat(lowerBand.toFixed(2)) };
}

function calculateUpwardTargets(currentPrice, resistance1, resistance2, resistance3) {
  const target1 = currentPrice * 1.02;
  const target2 = currentPrice * 1.05;
  const target3 = currentPrice * 1.10;
  const finalTarget1 = Math.max(target1, resistance1);
  const finalTarget2 = Math.max(target2, resistance2);
  const finalTarget3 = Math.max(target3, resistance3);
  return { shortTerm: parseFloat(finalTarget1.toFixed(2)), mediumTerm: parseFloat(finalTarget2.toFixed(2)), longTerm: parseFloat(finalTarget3.toFixed(2)) };
}

function generateBreakoutPrediction(currentPrice, pivotLevels, maSignal, vixValue) {
  let prediction = 'Neutral';
  let breakoutLevel = 0;
  let direction = 'sideways';
  if (currentPrice > pivotLevels.resistance1) {
    if (maSignal.includes('Bullish') && vixValue < 20) {
      prediction = 'Strong Bullish Breakout Expected';
      breakoutLevel = pivotLevels.resistance2;
      direction = 'upward';
    } else {
      prediction = 'Moderate Bullish Breakout';
      breakoutLevel = pivotLevels.resistance1;
      direction = 'upward';
    }
  } else if (currentPrice < pivotLevels.support1) {
    prediction = 'Bearish Breakdown Risk';
    breakoutLevel = pivotLevels.support2;
    direction = 'downward';
  } else if (currentPrice > pivotLevels.pivot) {
    prediction = 'Above Pivot - Bullish Bias';
    breakoutLevel = pivotLevels.resistance1;
    direction = 'upward';
  } else {
    prediction = 'Below Pivot - Bearish Bias';
    breakoutLevel = pivotLevels.support1;
    direction = 'downward';
  }
  return { signal: prediction, breakoutLevel: parseFloat(breakoutLevel.toFixed(2)), direction };
}

function getLastNDaysData(closes, highs, lows, n) {
  const recentCloses = closes.slice(-n);
  const recentHighs = highs.slice(-n);
  const recentLows = lows.slice(-n);
  return { high: Math.max(...recentHighs), low: Math.min(...recentLows), close: recentCloses[recentCloses.length - 1] };
}

function getTrendStrength(currentPrice, ma10, ma20, ma50) {
  if (currentPrice > ma10 && ma10 > ma20 && ma20 > ma50) return 'Very Strong Bullish';
  else if (currentPrice > ma10 && ma10 > ma20) return 'Strong Bullish';
  else if (currentPrice > ma20) return 'Moderate Bullish';
  else if (currentPrice < ma10 && ma10 < ma20 && ma20 < ma50) return 'Very Strong Bearish';
  else if (currentPrice < ma10 && ma10 < ma20) return 'Strong Bearish';
  else if (currentPrice < ma20) return 'Moderate Bearish';
  else return 'Sideways/Neutral';
}

function getRiskLevel(vixValue, currentPrice, pivotLevels) {
  let riskScore = 0;
  if (vixValue > 25) riskScore += 3;
  else if (vixValue > 20) riskScore += 2;
  else if (vixValue > 15) riskScore += 1;
  const pivotDistance = Math.abs(currentPrice - pivotLevels.pivot) / pivotLevels.pivot * 100;
  if (pivotDistance > 2) riskScore += 2;
  else if (pivotDistance > 1) riskScore += 1;
  if (riskScore >= 4) return 'High Risk';
  else if (riskScore >= 2) return 'Moderate Risk';
  else return 'Low Risk';
}

async function fetchYahooChart(symbol, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${qs}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
  if (!res.ok) throw new Error(`Yahoo fetch failed: ${res.status}`);
  return res.json();
}

app.get('/api/nifty', async (req, res) => {
  try {
    const [data, vixData] = await Promise.all([
      fetchYahooChart(SYMBOL, { interval: '1d', range: '6mo' }),
      fetchYahooChart(VIX_SYMBOL, { interval: '1d', range: '1d' })
    ]);

    const result = data?.chart?.result?.[0];
    const vixResult = vixData?.chart?.result?.[0];
    if (!result || !vixResult) return res.status(502).json({ error: 'Data not available' });

    const meta = result.meta;
    const vixMeta = vixResult.meta;
    const q = result.indicators.quote[0];
    const closes = q.close.filter(v => v != null);
    const highs = q.high.filter(v => v != null);
    const lows = q.low.filter(v => v != null);

    if (closes.length < 100) return res.status(400).json({ error: `Only ${closes.length} data points (need 100)` });

    const currentPrice = meta.regularMarketPrice;
    const chartPrevClose = meta.chartPreviousClose ?? meta.previousClose ?? (closes.length >= 2 ? closes[closes.length - 2] : currentPrice);
    const change = currentPrice - chartPrevClose;
    const percentChange = chartPrevClose ? (change / chartPrevClose) * 100 : 0;
    const ma10 = calculateMA(closes, 10);
    const ma15 = calculateMA(closes, 15);
    const ma20 = calculateMA(closes, 20);
    const ma30 = calculateMA(closes, 30);
    const ma50 = calculateMA(closes, 50);
    const ma100 = calculateMA(closes, 100);

    const maPrediction = generatePrediction(ma15, ma50);
    const vixValue = vixMeta.regularMarketPrice;
    const vixPrediction = generateVixPrediction(vixValue);

    const recentData = getLastNDaysData(closes, highs, lows, 5);
    const pivotLevels = calculatePivotPoints(recentData.high, recentData.low, recentData.close);
    const fibData = getLastNDaysData(closes, highs, lows, 10);
    const fibLevels = calculateFibonacciLevels(fibData.high, fibData.low);
    const bollingerBands = calculateBollingerBands(closes, 20, 2);
    const upwardTargets = calculateUpwardTargets(currentPrice, pivotLevels.resistance1, pivotLevels.resistance2, pivotLevels.resistance3);
    const breakoutPrediction = generateBreakoutPrediction(currentPrice, pivotLevels, maPrediction.signal, vixValue);

    const payload = {
      symbol: 'NIFTY 50',
      currentPrice,
      change: parseFloat(change.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(2)),
      maPrediction: maPrediction.signal,
      ma: {
        ma10: ma10[ma10.length - 1],
        ma15: ma15[ma15.length - 1],
        ma20: ma20[ma20.length - 1],
        ma30: ma30[ma30.length - 1],
        ma50: ma50[ma50.length - 1],
        ma100: ma100[ma100.length - 1]
      },
      marketTime: new Date(meta.regularMarketTime * 1000).toISOString(),
      vix: {
        value: vixValue,
        prediction: vixPrediction
      },
      pivotLevels,
      fibLevels,
      bollingerBands,
      breakoutPrediction,
      upwardTargets,
      nextZones: {
        nextResistance: pivotLevels.resistance1 > currentPrice ? pivotLevels.resistance1 : pivotLevels.resistance2,
        nextSupport: pivotLevels.support1 < currentPrice ? pivotLevels.support1 : pivotLevels.support2
      },
      trendStrength: getTrendStrength(currentPrice, ma10[ma10.length - 1], ma20[ma20.length - 1], ma50[ma50.length - 1]),
      riskLevel: getRiskLevel(vixValue, currentPrice, pivotLevels),
      serverTime: new Date().toISOString()
    };

    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


