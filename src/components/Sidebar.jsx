import { PRESETS } from '../lib/model.js'

function Slider({ label, value, min, max, step, onChange, display, hint }) {
  const pct = ((value - min) / (max - min)) * 100
  const track = `linear-gradient(to right, #22e39a 0%, #22e39a ${pct}%, #1c2b33 ${pct}%, #1c2b33 100%)`

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="font-mono text-[13px] font-medium text-ink">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: track }}
        aria-label={label}
      />
      <div className="mt-1 flex justify-between font-mono text-[9px] text-dim">
        <span>{hint ? hint[0] : min}</span>
        <span>{hint ? hint[1] : max}</span>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{title}</div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export default function Sidebar({ inputs, onChange, onPreset }) {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-r border-line bg-panel">
      <div className="border-b border-line px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          Control Panel
        </div>
        <div className="mt-1 text-[11px] leading-relaxed text-dim">
          Drag any input — the deal re-underwrites live.
        </div>
      </div>

      <div className="border-b border-line px-5 py-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
          Scenario Presets
        </div>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p)}
              className="group flex items-center justify-between rounded border border-line bg-panel2 px-3 py-2 text-left transition-colors hover:border-green/60 hover:bg-[#0f1a20]"
            >
              <span className="text-[12px] text-ink">{p.name}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-dim group-hover:text-green">
                {p.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Section title="Capital & Operations">
        <Slider
          label="CapEx"
          value={inputs.capexPerKwh}
          min={100}
          max={500}
          step={5}
          onChange={onChange('capexPerKwh')}
          display={`$${inputs.capexPerKwh}/kWh`}
        />
        <Slider
          label="Capacity"
          value={inputs.capacityMwh}
          min={10}
          max={500}
          step={5}
          onChange={onChange('capacityMwh')}
          display={`${inputs.capacityMwh} MWh`}
        />
        <Slider
          label="Round-trip efficiency"
          value={inputs.roundTripEff}
          min={70}
          max={95}
          step={1}
          onChange={onChange('roundTripEff')}
          display={`${inputs.roundTripEff}%`}
        />
        <Slider
          label="O&M"
          value={inputs.omPct}
          min={0.5}
          max={4}
          step={0.1}
          onChange={onChange('omPct')}
          display={`${inputs.omPct.toFixed(1)}% capex/yr`}
        />
      </Section>

      <Section title="Market">
        <Slider
          label="Peak / off-peak spread"
          value={inputs.spread}
          min={20}
          max={350}
          step={5}
          onChange={onChange('spread')}
          display={`$${inputs.spread}/MWh`}
        />
        <Slider
          label="Degradation rate"
          value={inputs.degradation}
          min={0.5}
          max={5}
          step={0.1}
          onChange={onChange('degradation')}
          display={`${inputs.degradation.toFixed(1)}%/yr`}
        />
        <Slider
          label="Cycles per day"
          value={inputs.cyclesPerDay}
          min={0.25}
          max={2}
          step={0.05}
          onChange={onChange('cyclesPerDay')}
          display={`${inputs.cyclesPerDay.toFixed(2)}×`}
        />
      </Section>

      <Section title="Finance">
        <Slider
          label="Hurdle rate (NPV discount)"
          value={inputs.discountRate}
          min={4}
          max={15}
          step={0.5}
          onChange={onChange('discountRate')}
          display={`${inputs.discountRate}%`}
        />
      </Section>

      <div className="px-5 py-4 text-[10px] leading-relaxed text-dim">
        Illustrative sample data for demonstration only — not investment advice. Merchant
        arbitrage assumes full spread capture with no curtailment or ancillary revenue.
      </div>
    </aside>
  )
}
