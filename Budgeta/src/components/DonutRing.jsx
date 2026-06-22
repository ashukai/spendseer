/**
 * SVG donut ring.
 * segments: [{ color, value }]  — values are summed to 100%.
 */
export default function DonutRing({ segments = [], loading = false }) {
  const size   = 220
  const cx     = size / 2
  const cy     = size / 2
  const R      = 88
  const stroke = 28

  const total = segments.reduce((s, seg) => s + seg.value, 0)

  if (loading || total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="var(--ring-empty, #E8E8F4)"
          strokeWidth={stroke}
        />
      </svg>
    )
  }

  const arcs = buildArcs(segments, total, R, cx, cy)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <path
          key={i}
          d={arc.d}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  )
}

function buildArcs(segments, total, R, cx, cy) {
  const circumference = 2 * Math.PI * R
  const arcs = []
  let offset = -Math.PI / 2 // start at 12 o'clock

  for (const seg of segments) {
    const angle = (seg.value / total) * 2 * Math.PI
    const x1 = cx + R * Math.cos(offset)
    const y1 = cy + R * Math.sin(offset)
    const x2 = cx + R * Math.cos(offset + angle)
    const y2 = cy + R * Math.sin(offset + angle)
    const large = angle > Math.PI ? 1 : 0

    arcs.push({
      color: seg.color,
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
    })
    offset += angle
  }

  return arcs
}
