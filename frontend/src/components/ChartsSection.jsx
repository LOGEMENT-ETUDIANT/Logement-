import React from 'react'
import './charts.css'

/* =======================
   Utils
======================= */
const fmt = (n, decimals = 0) =>
  n != null
    ? Number(n).toLocaleString('fr-FR', { maximumFractionDigits: decimals })
    : '—'

const COLORS = [
  '#ff4d4f',
  '#ff9f43',
  '#fed330',
  '#3ae374',
  '#32ffce',
  '#18dcff',
  '#7d5fff',
  '#e84393',
  '#fd79a8',
  '#00cec9',
  '#6c5ce7',
  '#ffeaa7',
]

// Courbe lissée (Catmull-Rom -> Bezier)
function catmullRomToBezier(points, tension = 1) {
  if (points.length < 2) return ''
  const d = [`M ${points[0].x} ${points[0].y}`]

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`)
  }
  return d.join(' ')
}

/* =======================
   Histogram
======================= */
function HistogramCard({ title, rows, valueKey, unit, id = 'hist' }) {
  const safe = Array.isArray(rows) ? rows.filter(r => r && r.code_postal) : []
  const values = safe.map(r => Number(r[valueKey] || 0))
  const max = values.length ? Math.max(...values) : 0

  const gradId = `${id}-histGradient`

  return (
    <div className="chart-card">
      <div className="chart-card-title">{title}</div>

      {safe.length === 0 || !max ? (
        <div className="chart-empty">Aucune donnée.</div>
      ) : (
        <div className="histogram">
          <div className="chart-frame">
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="xMidYMid meet"
              className="hist-svg"
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff4d4f" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ff4d4f" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* Axe */}
              <line x1="0" y1="56" x2="100" y2="56" className="hist-axis" />

              {safe.map((r, idx) => {
                const v = Number(r[valueKey] || 0)
                const height = (v / max) * 42
                const barWidth = 100 / safe.length
                const x = idx * barWidth + barWidth * 0.18
                const w = barWidth * 0.64
                const y = 56 - height

                return (
                  <g key={r.code_postal}>
                    <rect
                      className="hist-bar"
                      x={x}
                      y={y}
                      width={w}
                      height={height}
                      rx="1.8"
                      ry="1.8"
                      fill={`url(#${gradId})`}
                    />
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="hist-footer">
            <span className="hist-unit">{unit}</span>
            <span className="hist-range">max {fmt(max, 0)} {unit}</span>
          </div>

          <div className="hist-labels">
            {safe.map(r => (
              <span key={r.code_postal} className="hist-label">
                {r.code_postal}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* =======================
   Line chart (FULL WIDTH)
======================= */
function LineCard({ title, rows, valueKey, unit, id = "line" }) {
  const safe = Array.isArray(rows)
    ? rows.filter(
      r =>
        r &&
        r.code_postal &&
        r[valueKey] != null &&
        Number.isFinite(Number(r[valueKey]))
    )
    : []

  if (!safe.length) {
    return (
      <div className="chart-card">
        <div className="chart-card-title">{title}</div>
        <div className="chart-empty">Aucune donnée.</div>
      </div>
    )
  }

  const values = safe.map(r => Number(r[valueKey]))
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1

  const W = 100
  const H = 100
  const padL = 12
  const padR = 4
  const padT = 10
  const padB = 28

  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const pts = safe.map((r, i) => {
    const v = Number(r[valueKey])
    const x =
      safe.length === 1
        ? padL + innerW / 2
        : padL + (i / (safe.length - 1)) * innerW

    const y = padT + (1 - (v - min) / span) * innerH

    return { ...r, x, y, v }
  })

  const labelStep = safe.length > 14 ? 3 : safe.length > 9 ? 2 : 1

  const lineD =
    "M " +
    pts
      .map(p => `${p.x} ${p.y}`)
      .join(" L ")

  return (
    <div className="chart-card">
      <div className="chart-card-title">{title}</div>

      <div className="chart-frame">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="linechart-svg"
        >
          {/* ==== AXE Y ==== */}
          <line
            x1={padL}
            y1={padT}
            x2={padL}
            y2={padT + innerH}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
          />

          {/* ==== AXE X ==== */}
          <line
            x1={padL}
            y1={padT + innerH}
            x2={padL + innerW}
            y2={padT + innerH}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
          />

          {/* ==== GRILLE + LABEL Y ==== */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = padT + (i / 4) * innerH
            const value = max - (i / 4) * span

            return (
              <g key={i}>
                <line
                  x1={padL}
                  x2={padL + innerW}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.6"
                />
                <text
                  x={padL - 2}
                  y={y + 1.5}
                  fontSize="3.5"
                  fill="rgba(255,255,255,0.6)"
                  textAnchor="end"
                >
                  {Math.round(value)}
                </text>
              </g>
            )
          })}

          {/* ==== LABEL X ==== */}
          {pts.map((p, i) => (
            i % labelStep === 0 || i === pts.length - 1 ? (
              <text
                key={i}
                x={p.x}
                y={padT + innerH + 7}
                fontSize="3.2"
                fill="rgba(255,255,255,0.6)"
                textAnchor="end"
                transform={`rotate(-32 ${p.x} ${padT + innerH + 7})`}
              >
                {p.code_postal}
              </text>
            ) : null
          ))}

          {/* ==== COURBE ==== */}
          <path
            d={lineD}
            fill="none"
            stroke="#ff4d4f"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* ==== POINTS ==== */}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="#ff4d4f"
            />
          ))}
        </svg>
      </div>

      <div className="linechart-legend">
        {fmt(min)} — {fmt(max)} {unit}
      </div>
    </div>
  )
}
/* =======================
   Pie
======================= */
function PieCard({ title, rows }) {
  const safe = Array.isArray(rows) ? rows.filter(r => r && r.code_postal) : []
  const total = safe.reduce((acc, r) => acc + (Number(r.count) || 0), 0)

  if (!safe.length || !total) {
    return (
      <div className="chart-card chart-card--full">
        <div className="chart-card-title">{title}</div>
        <div className="chart-empty">Aucune donnée.</div>
      </div>
    )
  }

  let accAngle = 0
  const slices = safe.map((r, idx) => {
    const value = Number(r.count) || 0
    const start = accAngle
    const angle = (value / total) * 360
    const end = start + angle
    accAngle = end
    return {
      ...r,
      start,
      end,
      color: COLORS[idx % COLORS.length],
      pct: (value / total) * 100,
    }
  })

  const gradient = slices
    .map(s => `${s.color} ${s.start.toFixed(1)}deg ${s.end.toFixed(1)}deg`)
    .join(', ')

  return (
    <div className="chart-card chart-card--full">
      <div className="chart-card-title">{title}</div>
      <div className="pie-layout">
        <div className="pie-circle" style={{ backgroundImage: `conic-gradient(${gradient})` }}>
          <div className="pie-hole">
            <span className="pie-hole-value">{fmt(total, 0)}</span>
            <span className="pie-hole-label">annonces</span>
          </div>
        </div>

        <div className="pie-legend">
          {slices.map(s => (
            <div className="pie-legend-row" key={s.code_postal}>
              <span className="pie-legend-color" style={{ backgroundColor: s.color }} />
              <span className="pie-legend-label">{s.code_postal}</span>
              <span className="pie-legend-value">
                {fmt(s.count, 0)} ({s.pct.toFixed(1)} %)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =======================
   Section
======================= */
export default function ChartsSection({ byPostal = [], contextLabel = '' }) {
  const rows = Array.isArray(byPostal) ? byPostal : []
  const base = rows.filter(r => r && r.code_postal)

  const topCount = [...base]
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 12)

  const lineData = [...base]
    .sort((a, b) => (a.code_postal || '').localeCompare(b.code_postal || ''))
    .slice(0, 20)

  return (
    <section className="dash-card charts-section" id="charts">
      <div className="dash-card-header">
        <div>
          <h2>Graphes</h2>
          <p>{contextLabel || 'Répartition par code postal (top 12)'}</p>
        </div>
      </div>

      <div className="charts-grid">
        <HistogramCard
          id="chart1"
          title="Histogramme des annonces par zone"
          rows={topCount}
          valueKey="count"
          unit="annonces"
        />

        <LineCard
          id="chart2"
          title="Courbe des loyers moyens"
          rows={lineData}
          valueKey="avg_price"
          unit="€ / mois"
        />

        <PieCard title="Répartition des annonces (camembert)" rows={topCount} />
      </div>
    </section>
  )
}
