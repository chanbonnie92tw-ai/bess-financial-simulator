import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import CashflowChart from './components/CashflowChart.jsx'
import KpiCard from './components/KpiCard.jsx'
import { DEFAULTS, computeModel, fmtMoney, fmtMwh } from './lib/model.js'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return (
    <span className="text-muted">
      {hh}:{mm}
      <span className="text-dim">:{ss}</span> <span className="text-dim">LOCAL</span>
    </span>
  )
}

function Ticker({ model, inputs }) {
  const items = [
    {
      label: 'IRR',
      value: model.irrPct == null ? '—' : `${model.irrPct.toFixed(1)}%`,
      tone: model.bankable ? 'text-green' : 'text-red',
    },
    {
      label: 'PAYBACK',
      value: model.payback == null ? `>${model.years}y` : `${model.payback.toFixed(1)}y`,
      tone: 'text-ink',
    },
    {
      label: 'NPV',
      value: fmtMoney(model.npv),
      tone: model.npv >= 0 ? 'text-green' : 'text-red',
    },
    {
      label: 'SPREAD',
      value: `$${inputs.spread}/MWh`,
      tone: 'text-amber',
    },
    {
      label: 'CAPEX',
      value: `$${inputs.capexPerKwh}/kWh`,
      tone: 'text-ink',
    },
    {
      label: 'DEGRADATION',
      value: `${inputs.degradation.toFixed(1)}%/yr`,
      tone: 'text-muted',
    },
  ]

  return (
    <div className="flex h-8 items-center gap-6 overflow-x-auto border-t border-line bg-[#080d11] px-5 font-mono text-[11px]">
      {items.map((it, i) => (
        <div key={it.label} className="flex shrink-0 items-center gap-2">
          {i > 0 && <span className="mr-4 text-line">|</span>}
          <span className="text-dim">{it.label}</span>
          <span className={it.tone}>{it.value}</span>
        </div>
      ))}
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-6">
        <span className="text-dim">STATUS</span>
        <span className={model.bankable ? 'text-green' : 'text-red'}>
          {model.bankable ? 'INVESTABLE' : 'REJECT'}
        </span>
      </div>
    </div>
  )
}

function VerdictChip({ bankable, irrPct, hurdle }) {
  return (
    <div
      className={`shrink-0 rounded-md border px-4 py-3 text-right ${
        bankable
          ? 'border-green/40 bg-green/5'
          : 'border-red/40 bg-red/5'
      }`}
    >
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
        Underwriting verdict
      </div>
      <div
        className={`mt-1 font-mono text-lg font-bold ${
          bankable ? 'text-green glow-green' : 'text-red'
        }`}
      >
        {bankable ? 'BANKABLE' : 'SUB-HURDLE'}
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-dim">
        IRR {irrPct == null ? '—' : `${irrPct.toFixed(1)}%`} vs {hurdle}% hurdle
      </div>
    </div>
  )
}

export default function App() {
  const [inputs, setInputs] = useState(DEFAULTS)
  const model = useMemo(() => computeModel(inputs), [inputs])

  const onChange = (key) => (value) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const onPreset = (preset) =>
    setInputs((prev) => ({ ...prev, ...preset.values }))

  const irrPct = model.irrPct
  const bankable = model.bankable
  const be = model.breakevenSpread
  const beTxt = be == null ? 'n/a' : `$${Math.round(be)}`
  const marginPct = model.margin == null ? null : model.margin * 100
  const paybackTxt =
    model.payback == null ? `> ${model.years} yr` : `${model.payback.toFixed(1)} yr`

  const advisor = bankable
    ? `Clears the ${inputs.discountRate}% hurdle at a ${
        irrPct == null ? '—' : irrPct.toFixed(1)
      }% project IRR. The market only needs ${beTxt}/MWh to hit the hurdle — today's ${
        inputs.spread
      }/MWh spread leaves ${
        marginPct == null ? '—' : `${marginPct.toFixed(0)}%`
      } headroom.`
    : `Below the ${inputs.discountRate}% hurdle at ${
        irrPct == null ? '—' : `${irrPct.toFixed(1)}%`
      }. The peak/off-peak spread must reach ${beTxt}/MWh (now ${
        inputs.spread
      }) — or cut CapEx / lift cycles — before the deal is investable.`

  return (
    <div className="flex h-full flex-col bg-base">
      <header className="shrink-0 border-b border-line">
        <div className="flex h-12 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-sm bg-green shadow-[0_0_8px_#22e39a]" />
            <span className="font-mono text-sm font-bold tracking-[0.18em] text-ink">
              BESS<span className="text-green">//</span>TERMINAL
            </span>
            <span className="hidden text-[10px] font-mono uppercase tracking-[0.2em] text-muted md:inline">
              APAC grid arbitrage · financial simulator
            </span>
          </div>
          <div className="flex items-center gap-5 font-mono text-[11px]">
            <Clock />
            <span className="flex items-center gap-1.5 text-green">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-green" />
              LIVE MODEL
            </span>
          </div>
        </div>
        <Ticker model={model} inputs={inputs} />
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar inputs={inputs} onChange={onChange} onPreset={onPreset} />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-5 p-6">
            <section className="flex items-start justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-green">
                  Battery energy storage · project finance
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                  BESS Financial Simulator
                </h1>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
                  10-year merchant arbitrage model for grid-scale storage. Drag capex,
                  degradation or the peak/off-peak spread and the IRR, payback and breakeven
                  spread recompute instantly. Sample test data — not a real project.
                </p>
              </div>
              <VerdictChip bankable={bankable} irrPct={irrPct} hurdle={inputs.discountRate} />
            </section>

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                label="Project IRR"
                value={irrPct == null ? '—' : `${irrPct.toFixed(1)}%`}
                sub={`Hurdle rate ${inputs.discountRate}%`}
                tone={bankable ? 'green' : 'red'}
                accent={bankable ? 'green' : 'red'}
              />
              <KpiCard
                label="Payback period"
                value={paybackTxt}
                sub={`Over ${model.years}-year evaluation`}
                tone={model.payback == null ? 'red' : 'ink'}
                accent={model.payback == null ? 'red' : 'amber'}
              />
              <KpiCard
                label="NPV"
                value={fmtMoney(model.npv)}
                sub={`Discounted @ ${inputs.discountRate}%`}
                tone={model.npv >= 0 ? 'green' : 'red'}
                accent={model.npv >= 0 ? 'green' : 'red'}
              />
              <KpiCard
                label="Breakeven spread"
                value={beTxt === 'n/a' ? 'n/a' : `${beTxt}/MWh`}
                sub={`Current spread $${inputs.spread}/MWh`}
                tone="cyan"
                accent="cyan"
              />
            </section>

            <section className="rounded-md border border-line bg-panel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                  10-year projected cash flow
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-green/80" />
                    Net cash flow
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-[2px] w-4 bg-amber" />
                    Cumulative
                  </span>
                </div>
              </div>
              <div className="p-3">
                <CashflowChart rows={model.rows} />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-line bg-panel p-4 md:col-span-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                  Underwriting read
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink/90">{advisor}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ['LCOE', model.lcoe ? `$${model.lcoe.toFixed(0)}/MWh` : '—'],
                    ['Y1 revenue', fmtMoney(model.year1Revenue)],
                    ['O&M / yr', fmtMoney(model.om)],
                    ['Lifetime throughput', fmtMwh(model.totalDischarged)],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded border border-line bg-panel2 px-2.5 py-1.5 font-mono text-[10px]"
                    >
                      <span className="text-dim">{k}</span>{' '}
                      <span className="text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-line bg-panel p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                  Assumption snapshot
                </div>
                <dl className="mt-2 space-y-1.5 font-mono text-[11px]">
                  {[
                    ['Total capex', fmtMoney(model.capex)],
                    ['Capacity', `${inputs.capacityMwh} MWh`],
                    ['Round-trip eff.', `${inputs.roundTripEff}%`],
                    ['Cycles / day', `${inputs.cyclesPerDay.toFixed(2)}×`],
                    ['Degradation', `${inputs.degradation.toFixed(1)}%/yr`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <p className="pb-2 text-[10px] leading-relaxed text-dim">
              Illustrative sample data for demonstration only — not investment advice. Merchant
              arbitrage assumes full spread capture; excludes ancillary/FCAS revenue, curtailment,
              charging cost timing and financing structure. Built as an independent project.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
