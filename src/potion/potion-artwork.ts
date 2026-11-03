import { AbsoluteLayout, GridLayout, View } from '@nativescript/core'
import { bind, type MotionScope, type MotionValue } from '@rafaelaugusto/jolt'
import { shape, type Shape, type ShapeOptions } from '@rafaelaugusto/jolt/shapes'
import { BOTTLE, INNER, LIQUID, PULSE_INSET, chainLinks, stars, stripes, swirl } from './geometry'

/** Builds the scene once and exposes the pieces animated by PotionView. */
export class PotionArtwork {
  cap!: AbsoluteLayout
  crystal!: AbsoluteLayout
  chain!: Shape
  spider!: AbsoluteLayout
  hangingSpider!: AbsoluteLayout
  legs: View[] = []
  hangingLegs: View[] = []
  bubbles!: GridLayout
  sparks!: GridLayout
  hoverGlow!: GridLayout
  charge!: AbsoluteLayout
  chargeTip!: AbsoluteLayout
  chargeImpact!: GridLayout
  private drawings: Shape[] = []

  constructor(
    private stage: AbsoluteLayout,
    private fill: MotionValue,
    private scope: MotionScope,
  ) {
    this.draw()
  }

  dispose() {
    this.drawings.forEach(drawing => drawing.dispose())
    this.drawings = []
  }

  private box(parent: AbsoluteLayout, x: number, y: number, width: number, height: number) {
    const view = new GridLayout()
    view.width = width
    view.height = height
    view.isUserInteractionEnabled = false
    view.accessible = false
    AbsoluteLayout.setLeft(view, x)
    AbsoluteLayout.setTop(view, y)
    parent.addChild(view)
    return view
  }

  private group(parent: AbsoluteLayout, x: number, y: number, width: number, height: number) {
    const view = new AbsoluteLayout()
    view.width = width
    view.height = height
    view.isUserInteractionEnabled = false
    view.accessible = false
    AbsoluteLayout.setLeft(view, x)
    AbsoluteLayout.setTop(view, y)
    parent.addChild(view)
    return view
  }

  private vector(parent: AbsoluteLayout, width: number, height: number, options: Omit<ShapeOptions, 'viewBox'>, x = 0, y = 0) {
    const view = this.box(parent, x, y, width, height)
    // Shape controllers have their own background lifecycle. A scope should own
    // their playable animations, not dispose the controllers on suspension.
    const drawing = shape(view, { viewBox: [0, 0, width, height], strokeWidth: 0, ...options })
    this.drawings.push(drawing)
    return { view, drawing }
  }

  private drawSpider(parent: AbsoluteLayout, x: number, y: number) {
    const body = this.group(parent, x, y, 48, 48)
    const legs = [
      this.vector(body, 48, 48, { d: 'M23 22 L11 15 L7 5 M22 24 L7 21 L2 13 M22 28 L8 31 L4 40 M23 30 L15 39 L14 47', stroke: '#68716b', strokeWidth: 2.6, lineCap: 'square', lineJoin: 'miter' }).view,
      this.vector(body, 48, 48, { d: 'M27 22 L36 13 L39 4 M28 25 L43 18 L47 11 M28 28 L42 30 L47 37 M26 31 L35 39 L36 46', stroke: '#83907d', strokeWidth: 2.6, lineCap: 'square', lineJoin: 'miter' }).view,
    ]
    this.vector(body, 48, 48, { d: 'M18 17 L25 14 L31 18 L34 26 L30 34 L23 36 L17 31 L14 24 Z', fill: '#15141c', stroke: '#292833', strokeWidth: 1.2 })
    this.vector(body, 48, 48, { d: 'M17 15 L24 13 L27 18 L24 23 L17 22 L14 18 Z', fill: '#1b1823' })
    this.vector(body, 48, 48, { d: 'M23 23 H28 V26 H25 V29 H29 V31 H24 V28 H21 V25 H23 Z', fill: '#e64d5c' })
    this.vector(body, 48, 48, { d: 'M16 17 H18 V19 H16 Z M22 16 H24 V18 H22 Z', fill: '#d3ff86' })
    return { body, legs }
  }

  private draw() {
    const scope = this.scope
    const halo = this.group(this.stage, 0, 44, 352, 140)
    for (const x of [-4, 94, 192]) {
      const light = this.box(halo, x, 0, 140, 140)
      scope.gradient(light, { type: 'radial', colors: ['rgba(92,181,43,0.26)', 'rgba(60,117,28,0.07)', 'rgba(10,9,14,0)'], radius: 0.5 })
    }
    scope.use(() => bind(halo, { opacity: this.fill.to([0, 0.1, 1], [0.04, 0.3, 1]) }))
    this.hoverGlow = this.box(this.stage, 2, 48, 348, 128)
    scope.gradient(this.hoverGlow, { type: 'radial', colors: ['rgba(133,204,107,0.22)', 'rgba(10,9,14,0)'], radius: 0.5 })
    this.hoverGlow.opacity = 0

    this.chargeImpact = this.box(this.stage, LIQUID.x - 28, LIQUID.y - 25, 84, 84)
    scope.gradient(this.chargeImpact, {
      type: 'radial', colors: ['rgba(193,255,117,0.8)', 'rgba(111,250,47,0.24)', 'rgba(10,9,14,0)'],
      stops: [0, 0.3, 1], radius: 0.5,
    })
    this.chargeImpact.opacity = 0

    const dust = this.vector(this.stage, 360, 234, { d: stars(), stroke: '#b1cf85', strokeWidth: 0.8 }).view
    scope.animate(dust, { opacity: [0.12, 0.5, 0.12] }, { duration: 4400, repeat: Infinity, ease: 'easeInOut' })

    // The opaque cover reveals the textured liquid without scaling its artwork.
    this.vector(this.stage, 360, 234, { d: BOTTLE, fill: '#112218', stroke: '#38443a', strokeWidth: 3.3 })
    const pool = this.group(this.stage, LIQUID.x, LIQUID.y, LIQUID.width, LIQUID.height)
    pool.style.clipPath = INNER
    const color = this.box(pool, 0, 0, LIQUID.width, LIQUID.height)
    scope.gradient(color, { type: 'linear', angle: 180, colors: ['#d0ff83', '#80ee20', '#358d0d', '#65cb16'], stops: [0, 0.25, 0.8, 1] })
    const under = this.vector(pool, 352, 42, { d: swirl(0), fill: 'rgba(45,138,20,0.36)' }, -16, -4)
    scope.add(under.drawing.animate({ d: swirl(2.7) }, { duration: 1900, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }))
    const over = this.vector(pool, 352, 42, { d: swirl(2, -8), fill: 'rgba(225,255,125,0.21)' }, -22, -2)
    scope.add(over.drawing.animate({ d: swirl(5.1, -8) }, { duration: 2700, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }))
    const stripe = this.vector(pool, 352, 42, { d: stripes(), stroke: '#e8ffbf', strokeWidth: 1.35 }, -12, -3).view
    stripe.opacity = 0.73
    scope.animate(stripe, { x: [0, -32] }, { duration: 1800, ease: 'linear', repeat: Infinity })
    this.bubbles = this.box(pool, 0, 0, LIQUID.width, LIQUID.height)
    const cover = this.box(pool, 0, -2, LIQUID.width + 24, LIQUID.height + 4)
    scope.gradient(cover, { type: 'linear', angle: 180, colors: ['#122119', '#0e1712', '#18281b'] })
    scope.use(() => bind(cover, { x: this.fill.to([0, 1], [0, LIQUID.width + 4]) }))
    const front = this.vector(pool, 18, 38, { d: 'M0 0 C15 3 1 10 9 17 C17 25 0 30 4 38 L0 38 Z', fill: '#b9ff65' }, -6, -2)
    scope.add(front.drawing.animate({ d: 'M0 0 C3 5 14 11 7 17 C1 25 15 31 4 38 L0 38 Z' }, { duration: 640, repeat: Infinity, repeatType: 'reverse' }))
    scope.use(() => bind(front.view, { x: this.fill.to([0, 1], [0, LIQUID.width + 4]), opacity: this.fill.to([0, 0.015, 0.98, 1], [0, 0.8, 0.8, 0]) }))

    // A separate layer above the empty-liquid cover keeps the ignition pulse
    // visible at 0%. The pool clips the entire comet to the inside of the glass.
    this.charge = this.group(pool, 0, 0, 260 + PULSE_INSET, LIQUID.height)
    const trailGlow = this.box(this.charge, PULSE_INSET - 12, -15, 244, 64)
    scope.gradient(trailGlow, {
      type: 'radial', colors: ['rgba(148,255,65,0.6)', 'rgba(103,244,28,0.18)', 'rgba(103,244,28,0)'],
      center: { x: 0.15, y: 0.5 }, radius: 0.48,
    })
    const tail = this.box(this.charge, PULSE_INSET + 3, 7, 246, 21)
    tail.style.clipPath = 'polygon(0% 50%, 2% 15%, 6% 24%, 9% 4%, 13% 25%, 18% 14%, 23% 31%, 29% 20%, 35% 36%, 42% 25%, 49% 39%, 58% 30%, 67% 41%, 79% 36%, 100% 46%, 100% 58%, 80% 64%, 67% 58%, 57% 74%, 49% 65%, 41% 83%, 34% 68%, 28% 91%, 23% 74%, 18% 88%, 13% 76%, 9% 97%, 5% 79%, 2% 85%)'
    scope.gradient(tail, {
      type: 'linear', angle: 90, colors: ['#e5ffad', '#a9ff55', 'rgba(135,247,56,0.76)', 'rgba(99,219,38,0)'],
      stops: [0, 0.1, 0.4, 1],
    })
    const core = this.box(this.charge, PULSE_INSET + 5, 13, 194, 9)
    core.style.clipPath = 'polygon(0% 15%, 10% 0%, 20% 30%, 32% 10%, 43% 43%, 58% 25%, 75% 46%, 100% 48%, 100% 58%, 72% 60%, 58% 78%, 43% 65%, 32% 93%, 21% 68%, 10% 100%, 0% 85%)'
    scope.gradient(core, {
      type: 'linear', angle: 90, colors: ['#f2ffd0', '#baff61', 'rgba(129,251,41,0)'], stops: [0, 0.18, 1],
    })
    const tipGlow = this.box(this.charge, PULSE_INSET - 19, -11, 58, 58)
    scope.gradient(tipGlow, {
      type: 'radial', colors: ['rgba(222,255,161,0.95)', 'rgba(153,255,74,0.45)', 'rgba(118,247,29,0)'],
      stops: [0, 0.25, 1], radius: 0.5,
    })
    this.chargeTip = this.group(this.charge, PULSE_INSET - 4, 4, 28, 28)
    this.vector(this.chargeTip, 28, 28, {
      d: 'M3 10 L6 8 L7 4 L12 5 L15 3 L19 6 L23 6 L25 11 L23 15 L25 19 L21 23 L16 22 L12 25 L8 22 L4 21 L5 16 L2 14 Z',
      fill: '#bcff71',
    })
    this.vector(this.chargeTip, 28, 28, {
      d: 'M6 10 L10 7 L14 8 L17 6 L21 11 L20 15 L22 18 L17 21 L13 20 L9 22 L6 18 L7 15 L4 13 Z',
      fill: '#eeffc6',
    })
    this.charge.opacity = 0

    // Glass is above the liquid and remains visible at every fill level.
    this.vector(this.stage, 360, 234, { d: BOTTLE, stroke: '#9da699', strokeWidth: 1.3 })
    this.vector(this.stage, 360, 234, { d: 'M33 95 H275 L286 104 H300 M19 104 C12 120 23 132 37 132 H274 L286 124 H300', stroke: '#edf5db', strokeWidth: 0.9 }).view.opacity = 0.5
    this.vector(this.stage, 360, 234, { d: 'M44 100 H91 M104 100 H152 M177 100 H258 M40 128 H74', stroke: '#daeecb', strokeWidth: 1.2 }).view.opacity = 0.2
    this.vector(this.stage, 360, 234, { d: 'M297 98 H303 V130 H297 Z', fill: '#b88843', stroke: '#e0b86c', strokeWidth: 1 })
    this.vector(this.stage, 360, 234, { d: 'M305 95 H310 V133 H305 Z', fill: '#d1a15b', stroke: '#edd296', strokeWidth: 0.7 })

    this.cap = this.group(this.stage, 245, 129, 120, 120)
    this.cap.originX = 0.5
    this.cap.originY = 0
    this.chain = this.vector(this.cap, 120, 140, { d: chainLinks(), stroke: '#d6a34c', strokeWidth: 1.35, lineJoin: 'miter' }, 0, -30).drawing
    this.crystal = this.group(this.cap, 67, -37, 48, 48)
    const capGlow = this.box(this.crystal, -8, -8, 64, 64)
    scope.gradient(capGlow, { type: 'radial', colors: ['rgba(146,243,70,0.27)', 'rgba(10,9,14,0)'], radius: 0.62 })
    this.vector(this.crystal, 48, 48, { d: 'M4 13 L24 3 L44 13 L44 35 L25 47 L4 35 Z', fill: '#248124', stroke: '#56d84c', strokeWidth: 1 })
    this.vector(this.crystal, 48, 48, { d: 'M4 13 L24 3 L44 13 L25 25 Z', fill: '#8bf250' })
    this.vector(this.crystal, 48, 48, { d: 'M25 25 L44 13 V35 L25 47 Z', fill: '#1d6d26' })
    this.vector(this.crystal, 48, 48, { d: 'M4 13 L25 25 V47 L4 35 Z', fill: '#39b735' })
    this.vector(this.crystal, 48, 48, { d: 'M12 13 L24 7 L35 13 L24 20 Z', fill: '#b2ff70' })
    this.vector(this.crystal, 48, 48, { d: 'M9 20 V32 L15 36 V24 Z M30 29 V39 L39 34 V24 Z', fill: '#62df4b' }).view.opacity = 0.6
    const hanging = this.drawSpider(this.cap, 36, -24)
    this.hangingSpider = hanging.body
    this.hangingLegs = hanging.legs

    this.sparks = this.box(this.stage, LIQUID.x - 50, 62, 100, 100)
    scope.use(() => bind(this.sparks, { x: this.fill.to([0, 1], [0, LIQUID.width]) }))
    const walking = this.drawSpider(this.stage, 3, 82)
    this.spider = walking.body
    this.legs = walking.legs

    // Quiet graduation marks anchor the object without adding another panel.
    const ticks = Array.from({ length: 25 }, (_, i) => {
      const x = 24 + i * 11
      return `M${x} 177 V${i % 6 === 0 ? 184 : 180}`
    }).join(' ')
    this.vector(this.stage, 360, 234, { d: ticks, stroke: '#665d72', strokeWidth: 0.8 }).view.opacity = 0.4
  }
}
