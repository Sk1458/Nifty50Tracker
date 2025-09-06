# Nifty Tracker

A simple, responsive web dashboard for tracking the Nifty 50 index, key moving averages, volatility (VIX), and technical indicators. Data is sourced from Yahoo Finance.

🚀 **Live Demo:** [Click here to view](https://nifty50tracker.onrender.com/)

## Features
- Live Nifty 50 price and key technical indicators
- Dynamic arrangement of moving averages (MAs) above/below the live price
- VIX (volatility index) card at the top
- Responsive layout for desktop and mobile
- Manual and auto-refresh (fixed 30s interval)
- Clean, modern UI

## Recent Updates
- **Auto-refresh is now fixed at 30 seconds.**
- **Removed all client-side logic for market hours, holidays, and dynamic refresh rates.**
- **No more pausing or changing refresh rate on weekends/holidays.**

## Technology Stack
- Node.js + Express backend (API proxy and calculations)
- Vanilla JavaScript frontend
- HTML5 + CSS3 (Flexbox/Grid, responsive design)

## Installation
1. Clone the repo
2. Run `npm install`
3. Start the server: `npm run dev`
4. Visit `http://localhost:3000`

## Project Structure
- `backend/server.js` — Express backend, fetches and processes Yahoo Finance data
- `public/index.html` — Main HTML structure
- `public/styles.css` — All styles
- `public/main.js` — All frontend logic (including auto-refresh)
- `public/sw.js` — Service worker (optional)

## Data Flow
- Frontend fetches `/api/nifty` every 30 seconds
- Backend fetches and processes Yahoo Finance data
- No client-side time/holiday logic; refresh is always 30s

## Contributing
PRs welcome! Please open an issue to discuss major changes first.

## Support
For questions, open an issue or contact the maintainer.
