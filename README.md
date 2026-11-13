# BESS // Terminal — Financial Simulator

An APAC-focused **Battery Energy Storage System (BESS) financial simulator** built as a
React + Vite + Tailwind + Recharts dashboard. Drag the inputs and the deal re-underwrites
live — IRR, payback, NPV and the breakeven peak/off-peak spread all recompute instantly.

> Illustrative sample data for demonstration only — not investment advice.

## Why this exists

Built as an independent project ahead of a coffee chat with **Audacy Partners**, an
APAC climate-tech VC whose thesis is backing *proven* energy and industrial technology that
is **cost-competitive with fossil-fuel incumbents** and bankable in APAC. Their portfolio
already includes BESS companies (Ampd Energy, Moment Energy).

The tool is designed to answer the question an investment committee actually asks:
**what market spread makes this storage project bankable?** — rather than being a generic
finance toy.

## Features

- **Sidebar sliders** — CapEx ($/kWh), degradation (%/yr), peak/off-peak spread ($/MWh),
  capacity, cycles/day, round-trip efficiency, O&M and hurdle rate.
- **KPI cards** — Project IRR, payback period, NPV and breakeven spread.
- **10-year combo chart** — annual net cash flow (bars, green/red) + cumulative cash flow
  (line, crosses zero at payback).
- **Underwriting verdict** — BANKABLE / SUB-HURDLE chip plus a live "what needs to change" read.
- **Scenario presets** — utility-scale, C&I diesel-offset, high-spread market.
- Bloomberg-terminal dark mode: monospace figures, ticker strip, live clock.

## Model assumptions

For an N-year (default 10) merchant arbitrage case:

```
capex        = capexPerKwh × capacityMwh × 1000
discharged_y = capacityMwh × cyclesPerDay × 365 × (roundTripEff/100) × (1 − degr)^(y−1)
revenue_y    = discharged_y × spread
net_y        = revenue_y − O&M          (O&M = omPct × capex, flat)
cashflows    = [−capex, net_1, …, net_N]
```

- **IRR** — root of NPV = 0 over the cash flows (bisection).
- **Payback** — first year cumulative cash flow ≥ 0, linearly interpolated.
- **NPV** — discounted at the hurdle rate.
- **LCOE** — PV(capex + O&M) ÷ PV(discharged energy), i.e. $/MWh delivered.
- **Breakeven spread** — spread at which IRR == hurdle rate.

Excluded: ancillary/FCAS revenue, curtailment, charging-cost timing, debt/financing
structure, residual value and taxes.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

> If `npm install` hits an `EACCES`/`EEXIST` error on `~/.npm/_cacache`, point npm at a
> writable cache: `npm install --cache ./npm-cache`.

## Deploy

`netlify.toml` is included (build `npm run build`, publish `dist`). `vite.config.js` uses
`base: './'` so the build works from any sub-path.

## Embedding in the portfolio later

1. `npm run build`
2. Copy `dist/` into the portfolio, e.g. `bess-tool/`
3. Add a `bess-simulator.html` page and iframe `bess-tool/index.html` — same pattern as the
   offshore wind tool.
