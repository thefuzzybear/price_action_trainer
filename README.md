# Price Action Trainer

A standalone Electron app for training price action reading skills.

## Setup

```bash
npm install
npm start
```

## Usage

1. Enter a ticker symbol (or click 🎲 for a random one from the 500-stock seed list)
2. Choose an interval (default: daily), start/end dates, and how many bars to start with
3. Click **Load Data** — data is fetched from Yahoo Finance and cached locally
4. Use the keyboard to step through bars:

| Key | Action |
|-----|--------|
| → | Reveal next bar |
| ← | Remove last bar |
| ↑ | Jump forward 10 bars |
| ↓ | Jump back 10 bars |
| Space | Randomise start position |

## Noise injection

Toggle on to perturb OHLC values by a configurable percentage (0.1–5%). 
This randomises the chart enough to prevent recognition of exact historical moves.
Noise is applied on top of the cached raw data — toggling off restores the original.

## Cached data

Downloaded datasets are stored as JSON in `src/data/`. 
Re-loading the same symbol/interval/date range will use the cache without hitting Yahoo Finance.
You can delete individual datasets from the cache list in the sidebar.
