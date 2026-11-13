// ---------------------------------------------------------------------------
// BESS merchant-arbitrage financial model.
//
// A grid-scale battery buys at off-peak prices and sells at peak prices. The
// model values a 10-year merchant arbitrage project:
//
//   Year 0 : -total capex
//   Year n : revenue from cycling (net of degradation & round-trip losses)
//            minus fixed O&M
//
// Outputs: project IRR, simple payback, NPV, LCOE and the breakeven spread
// required to clear the investor's hurdle rate. All figures are illustrative.
// ---------------------------------------------------------------------------

export const DEFAULTS = {
  capexPerKwh: 250, // $/kWh installed
  capacityMwh: 100, // MWh energy capacity
  degradation: 2.0, // %/yr capacity fade
  spread: 120, // $/MWh peak-offpeak spread
  cyclesPerDay: 1.0, // full-equivalent cycles / day
  roundTripEff: 85, // % round-trip efficiency
  omPct: 1.5, // O&M as % of capex per year
  discountRate: 8, // % hurdle rate (also used for NPV)
  years: 10,
}

export const PRESETS = [
  {
    id: 'utility',
    name: 'Utility-scale',
    tag: 'SG · 100 MWh',
    values: {
      capexPerKwh: 250,
      capacityMwh: 100,
      degradation: 2.0,
      spread: 120,
      cyclesPerDay: 1.0,
      roundTripEff: 85,
      omPct: 1.5,
    },
  },
  {
    id: 'ci',
    name: 'C&I diesel-offset',
    tag: '400 MWh · 1.5 cyc',
    values: {
      capexPerKwh: 310,
      capacityMwh: 400,
      degradation: 2.5,
      spread: 210,
      cyclesPerDay: 1.5,
      roundTripEff: 88,
      omPct: 1.8,
    },
  },
  {
    id: 'high',
    name: 'High-spread market',
    tag: 'AU · 6h duration',
    values: {
      capexPerKwh: 230,
      capacityMwh: 250,
      degradation: 1.8,
      spread: 260,
      cyclesPerDay: 0.9,
      roundTripEff: 86,
      omPct: 1.4,
    },
  },
]

function computeIRR(cashflows) {
  const npvAt = (r) =>
    cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + r, t), 0)

  let lo = -0.9999
  let hi = 5
  let fLo = npvAt(lo)
  const fHi = npvAt(hi)

  // No sign change => IRR is undefined (project never returns capital).
  if (fLo === 0) return lo
  if (fLo * fHi > 0) return null

  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2
    const fMid = npvAt(mid)
    if (Math.abs(fMid) < 1e-6) return mid
    if (fLo * fMid < 0) {
      hi = mid
    } else {
      lo = mid
      fLo = fMid
    }
  }
  return (lo + hi) / 2
}

function computePayback(rows) {
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1]
    const cur = rows[i]
    if (cur.cumulative >= 0) {
      const gap = cur.cumulative - prev.cumulative
      if (gap === 0) return cur.year
      return prev.year + -prev.cumulative / gap
    }
  }
  return null
}

// Solve for the peak/off-peak spread at which IRR exactly equals the hurdle.
function solveBreakevenSpread(input) {
  const target = input.discountRate / 100
  const capex = input.capexPerKwh * input.capacityMwh * 1000
  const om = (capex * input.omPct) / 100
  const eff = input.roundTripEff / 100
  const degr = input.degradation / 100

  const npvAtSpread = (spread) => {
    let npv = -capex
    for (let y = 1; y <= input.years; y += 1) {
      const capFactor = Math.pow(1 - degr, y - 1)
      const discharged = input.capacityMwh * input.cyclesPerDay * 365 * eff * capFactor
      npv += (discharged * spread - om) / Math.pow(1 + target, y)
    }
    return npv
  }

  let lo = 0
  let hi = 2000
  if (npvAtSpread(hi) < 0) return null
  if (npvAtSpread(lo) >= 0) return 0

  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2
    if (npvAtSpread(mid) < 0) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return (lo + hi) / 2
}

export function computeModel(input) {
  const years = input.years
  const capex = input.capexPerKwh * input.capacityMwh * 1000
  const eff = input.roundTripEff / 100
  const degr = input.degradation / 100
  const om = (capex * input.omPct) / 100
  const disc = input.discountRate / 100

  const rows = []
  let cum = -capex
  rows.push({ year: 0, annual: -capex, cumulative: cum, revenue: 0, discharged: 0 })

  let npv = -capex
  let pvEnergy = 0
  let pvOm = 0
  let totalDischarged = 0
  let totalRevenue = 0

  for (let y = 1; y <= years; y += 1) {
    const capFactor = Math.pow(1 - degr, y - 1)
    const discharged = input.capacityMwh * input.cyclesPerDay * 365 * eff * capFactor
    const revenue = discharged * input.spread
    const net = revenue - om
    cum += net

    const d = Math.pow(1 + disc, y)
    npv += net / d
    pvEnergy += discharged / d
    pvOm += om / d
    totalDischarged += discharged
    totalRevenue += revenue

    rows.push({ year: y, annual: net, cumulative: cum, revenue, discharged })
  }

  const cashflows = rows.map((r) => r.annual)
  const irr = computeIRR(cashflows)
  const payback = computePayback(rows)
  const lcoe = pvEnergy > 0 ? (capex + pvOm) / pvEnergy : 0
  const breakevenSpread = solveBreakevenSpread(input)
  const year1Revenue = rows[1] ? rows[1].revenue : 0
  const margin =
    breakevenSpread && breakevenSpread > 0 ? input.spread / breakevenSpread - 1 : null

  return {
    rows,
    capex,
    om,
    irr,
    irrPct: irr == null ? null : irr * 100,
    payback,
    npv,
    lcoe,
    breakevenSpread,
    year1Revenue,
    totalDischarged,
    totalRevenue,
    margin,
    years,
    hurdle: input.discountRate,
    bankable: irr != null && irr * 100 >= input.discountRate,
  }
}

// ---- formatters -----------------------------------------------------------

export function fmtAxis(v) {
  const abs = Math.abs(v)
  if (abs >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (abs >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (abs >= 1e3) return (v / 1e3).toFixed(0) + 'K'
  return String(Math.round(v))
}

export function fmtMoney(v) {
  const sign = v < 0 ? '-' : ''
  return sign + '$' + fmtAxis(Math.abs(v))
}

export function fmtMwh(v) {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + ' TWh'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + ' GWh'
  return Math.round(v) + ' MWh'
}
