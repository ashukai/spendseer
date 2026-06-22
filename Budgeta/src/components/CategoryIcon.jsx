/**
 * CategoryIcon
 * Renders a colored circle with a Tabler outline icon inside.
 *
 * props:
 *   icon   — Tabler icon name stored in DB, e.g. "tools-kitchen-2"
 *   color  — hex stroke color, e.g. "#FF6B6B"
 *   bg     — hex background color (defaults to color at 15% opacity)
 *   size   — circle diameter in px (default 44)
 */
import * as TablerIcons from '@tabler/icons-react'

/** Convert kebab-case icon name → PascalCase component name, e.g. "tools-kitchen-2" → "IconToolsKitchen2" */
function toComponentName(name) {
  return (
    'Icon' +
    name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  )
}

/** Transparent hex — adds alpha channel to a 6-digit hex color */
function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

export default function CategoryIcon({ icon, color, bg, size = 44 }) {
  const iconSize = Math.round(size * 0.5)
  const background = bg ?? hexAlpha(color, 0.14)

  const componentName = toComponentName(icon)
  const IconComponent = TablerIcons[componentName] ?? TablerIcons.IconBox

  return (
    <div
      className="cat-circle"
      style={{
        width: size,
        height: size,
        background,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <IconComponent size={iconSize} stroke={1.8} color={color} />
    </div>
  )
}

export { hexAlpha, toComponentName }
