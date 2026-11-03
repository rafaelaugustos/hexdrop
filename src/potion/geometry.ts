export const STAGE = { width: 360, height: 234 } as const
export const LIQUID = { x: 17, y: 97, width: 272, height: 34 } as const
// Space for the ignition glow to fade before its moving view's edge.
export const PULSE_INSET = 32
export const BOTTLE = 'M34 92 L276 92 L287 101 L300 101 L300 127 L287 127 L276 136 L34 136 C4 136 4 92 34 92 Z'
export const INNER = 'polygon(0% 50%, 1% 25%, 3% 8%, 7% 0%, 96% 0%, 100% 22%, 100% 78%, 96% 100%, 7% 100%, 3% 92%, 1% 75%)'

/** Identical cubic topology allows native path interpolation in both renderers. */
export function swirl(phase: number, offset = 0): string {
  let path = `M-32 ${15 + offset}`
  for (let i = 0; i < 12; i++) {
    const x = -32 + i * 32
    const y = 15 + offset + Math.sin(i * 1.8 + phase) * 9
    path += ` C${x + 10} ${y - 9} ${x + 22} ${y + 10} ${x + 32} ${15 + offset}`
  }
  return `${path} L352 42 L-32 42 Z`
}

export function stripes(): string {
  return Array.from({ length: 12 }, (_, i) => {
    const x = i * 32 - 32
    return `M${x} -4 C${x + 2} 10 ${x + 8} 25 ${x + 22} 42`
  }).join(' ')
}

export function stars(): string {
  // Deterministic art keeps a reset from rearranging the scene.
  const points = [[30, 56, 2], [68, 159, 1.8], [102, 74, 1.3], [156, 49, 1.5],
    [203, 167, 2], [255, 57, 1.5], [322, 71, 2.6], [337, 185, 2], [21, 177, 1], [275, 190, 1.2]]
  return points.map(([x, y, r]) => `M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r}`).join(' ')
}

export function chainLinks(open = false): string {
  // Same nine links in both poses: the loose loop straightens as the stopper falls.
  // Coordinates include the chain surface's 30-point top inset.
  const control = open ? [60, 54] : [65, 59]
  const end = open ? [60, 80] : [84, 35]
  return Array.from({ length: 9 }, (_, i) => {
    const t = i / 8
    const u = 1 - t
    const x = u * u * 60 + 2 * u * t * control[0] + t * t * end[0]
    const y = u * u * 30 + 2 * u * t * control[1] + t * t * end[1]
    const angle = Math.atan2(u * (control[1] - 30) + t * (end[1] - control[1]), u * (control[0] - 60) + t * (end[0] - control[0]))
    const dx = Math.cos(angle) * 3.3
    const dy = Math.sin(angle) * 3.3
    const nx = -Math.sin(angle) * 1.8
    const ny = Math.cos(angle) * 1.8
    return `M${x - dx} ${y - dy} L${x + nx} ${y + ny} L${x + dx} ${y + dy} L${x - nx} ${y - ny} Z`
  }).join(' ')
}

export type Rect = { x: number; y: number; width: number; height: number }

/** Window-space bounds of a card scaled and rotated around its center. */
export function transformedRect(rect: Rect, translation: { x: number; y: number }, scale: number, degrees: number): Rect {
  const angle = degrees * Math.PI / 180
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  const width = scale * (rect.width * cos + rect.height * sin)
  const height = scale * (rect.width * sin + rect.height * cos)
  return {
    x: rect.x + translation.x + (rect.width - width) / 2,
    y: rect.y + translation.y + (rect.height - height) / 2,
    width, height,
  }
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
