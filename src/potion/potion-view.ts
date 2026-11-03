import { AbsoluteLayout, Application, GridLayout } from '@nativescript/core'
import { animate, bind, motionScope, motionValue, particles, reducedMotion, set, stop, type MotionScope, type PlaybackAnimation } from '@rafaelaugusto/jolt'
import { PotionArtwork } from './potion-artwork'
import { LIQUID, STAGE, PULSE_INSET, chainLinks, type Rect } from './geometry'
import { PotionSound } from '../services/potion-sound'

// Sample once; Jolt compiles these mappings into native tracks on the fill clock.
const crawlStops = Array.from({ length: 73 }, (_, i) => i / 72)
const crawlHeight = crawlStops.map(p => 8 - 19 * Math.cos(p * Math.PI * 6))
const crawlAngle = crawlStops.map(p => 110 + 34 * Math.sin(p * Math.PI * 6))

/** Vector artwork and native Jolt playback. No WebView, canvas bridge or JS drawing loop. */
export class PotionView extends GridLayout {
  private stage = new AbsoluteLayout()
  private scope?: MotionScope
  private brewing?: MotionScope
  private fill = motionValue(0)
  private art?: PotionArtwork
  private runId = 0
  private scale = 1
  private travel?: PlaybackAnimation
  private sound?: PotionSound

  constructor() {
    super()
    this.height = STAGE.height
    this.accessible = false
    this.stage.width = STAGE.width
    this.stage.height = STAGE.height
    this.stage.horizontalAlignment = 'center'
    this.stage.verticalAlignment = 'middle'
    this.addChild(this.stage)
  }

  get progress() { return Math.max(0, Math.min(1, this.fill.get())) }

  onLoaded() {
    super.onLoaded()
    if (this.scope) return
    this.scope = motionScope()
    this.sound = new PotionSound()
    this.art = new PotionArtwork(this.stage, this.fill, this.scope)
    this.reset()
  }

  onUnloaded() {
    // Core unloads its root on backgrounding. Jolt has already paused its clocks;
    // preserve the scene and source value so loading can resume that same work.
    if (!Application.suspended) this.disposeScene()
    super.onUnloaded()
  }

  disposeScene() {
    this.runId++
    this.brewing?.dispose()
    this.brewing = undefined
    this.scope?.dispose()
    this.scope = undefined
    stop(this.fill)
    this.art?.dispose()
    this.art = undefined
    this.stage.removeChildren()
    this.sound?.dispose()
    this.sound = undefined
  }

  setSoundEnabled(enabled: boolean) { this.sound?.setEnabled(enabled) }

  onLayout(left: number, top: number, right: number, bottom: number) {
    super.onLayout(left, top, right, bottom)
    const width = this.getActualSize().width
    this.scale = Math.min(1.12, Math.max(0.2, (width - 12) / STAGE.width))
    this.stage.scaleX = this.scale
    this.stage.scaleY = this.scale
  }

  dropRect(): Rect {
    const point = this.getLocationInWindow()
    const size = this.getActualSize()
    return {
      x: point.x + (size.width - STAGE.width * this.scale) / 2 + 8 * this.scale,
      y: point.y + (size.height - STAGE.height * this.scale) / 2 + 67 * this.scale,
      width: 342 * this.scale, height: 96 * this.scale,
    }
  }

  hover(active: boolean) {
    if (!this.scope || !this.art) return
    this.scope.animate(this.art.hoverGlow, { opacity: active ? 0.8 : 0 }, { duration: 180 })
  }

  reset() {
    this.sound?.stop()
    this.runId++
    this.brewing?.dispose()
    this.brewing = undefined
    this.travel = undefined
    stop(this.fill)
    set(this.fill, 0)
    const art = this.art
    if (!this.scope || !art) return
    set(art.cap, { rotate: 0 })
    set(art.crystal, { x: 0, y: 0, rotate: 0 })
    art.chain.set({ d: chainLinks() })
    set(art.spider, { x: 0, y: -11, rotate: 110, scale: 1, opacity: 1 })
    set(art.hangingSpider, { x: 0, y: 0, rotate: 90, opacity: 0 })
    set(art.charge, { x: LIQUID.width - 6 - PULSE_INSET, opacity: 0 })
    set(art.chargeTip, { scale: 1 })
    set(art.chargeImpact, { opacity: 0, scale: 1 })
    ;[...art.legs, ...art.hangingLegs].forEach(leg => set(leg, { rotate: 0, scaleY: 1 }))
    this.hover(false)
  }

  async brew(): Promise<boolean> {
    const art = this.art
    if (!this.scope || !art) return false
    this.reset()
    const id = this.runId
    const run = this.brewing = motionScope()
    if (!reducedMotion()) {
      this.sound?.play('ignition')
      // The ingredient ignites at the neck and shoots back to the rounded end.
      // Its tail keeps fading while the actual fill begins at that landing point.
      run.animate(art.charge, { opacity: [0, 1, 1, 0] }, {
        duration: 780, times: [0, 0.06, 0.69, 1], ease: 'linear',
      })
      run.animate(art.chargeTip, { scale: [0.9, 1.1, 0.94, 1] }, { duration: 180, repeat: 3 })
      run.animate(art.chargeImpact, { opacity: [0, 0, 0.85, 0], scale: [0.6, 0.6, 1, 1.5] }, {
        duration: 780, times: [0, 0.6, 0.76, 1], ease: 'easeOut',
      })
      const ignition = run.animate(art.charge, { x: [LIQUID.width - 6 - PULSE_INSET, 4 - PULSE_INSET] }, { duration: 540, ease: 'linear' })
      if (!await ignition.finished || id !== this.runId || run.disposed) return false
    }
    run.use(() => bind(art.spider, {
      x: this.fill.to([0, 1], [0, 278]),
      y: this.fill.to(crawlStops, crawlHeight),
      rotate: this.fill.to(crawlStops, crawlAngle),
    }))
    run.use(() => particles(art.bubbles, {
      shape: 'ring', source: 'bottom', colors: ['#dbff98', '#9eff48'],
      rate: 9, size: 3.8, velocity: 13, velocityRange: 6, spread: 30, lifetime: 1900,
    }))
    run.use(() => particles(art.sparks, {
      colors: ['#b5ff64', '#eeffba', '#68c839'], rate: 11, size: 1.8,
      velocity: 27, velocityRange: 18, spread: 360, lifetime: 1300,
    }))
    run.animate(art.spider, { y: [0, -1.5, 0, 1, 0] }, { duration: 440, repeat: Infinity, layer: 'gait' })
    for (const [index, leg] of art.legs.entries()) {
      run.animate(leg, { rotate: index ? [-7, 7, -7] : [7, -7, 7], scaleY: [1, 0.85, 1] }, { duration: 330, repeat: Infinity })
    }
    this.travel = run.add(animate(this.fill, [0, 0.04, 0.24, 0.39, 0.58, 0.77, 0.89, 1], {
      duration: 8400, times: [0, 0.1, 0.27, 0.4, 0.55, 0.71, 0.85, 1], ease: 'linear',
    }))
    const played = await this.travel.finished
    if (id !== this.runId || (!played && this.progress < 0.999)) return false
    // Keep the filled vial alive; replace only the transient walking/emission scope.
    run.dispose()
    const finish = this.brewing = motionScope()
    this.sound?.play('complete')
    set(this.fill, 1)
    set(art.spider, { x: 278, y: -11, rotate: 110 })
    const hop = finish.animate(art.spider, { y: [-11, -25, 23], rotate: [110, 75, 90] }, { duration: 460, ease: ['easeOut', 'easeIn'] })
    finish.add(particles(art.sparks, {
      shape: 'rectangle', colors: ['#ddffa8', '#95ed42', '#eef9dc'],
      rate: 60, duration: 220, lifetime: 1500, size: 2.3, velocity: 58,
      velocityRange: 25, spread: 360, gravity: 35, spinRange: 90,
    }))
    void hop.finished.then(async completed => {
      if (!completed || id !== this.runId || finish.disposed) return
      // The two poses meet at the hinge. The hanging pose belongs to the stopper's
      // parent, so chain, crystal and spider keep one physical pivot as they swing.
      set(art.spider, { opacity: 0 })
      set(art.hangingSpider, { opacity: 1 })
      finish.animate(art.crystal, { x: -31, y: 83 }, { duration: 760, ease: 'easeInOut' })
      finish.add(art.chain.animate({ d: chainLinks(true) }, { duration: 760, ease: 'easeInOut' }))
      finish.animate(art.hangingSpider, { y: [0, 18, 56], rotate: [90, 128, 160] }, { duration: 1000, ease: 'easeInOut' })
      art.hangingLegs.forEach((leg, index) => {
        finish.animate(leg, { rotate: index ? [-8, 8, -8] : [8, -8, 8], scaleY: [1, 0.86, 1] }, { duration: 360, repeat: 3 })
      })
      const swing = finish.animate(art.cap, { rotate: [0, -25, 28, -20, 14, -9, 5, 0] }, {
        duration: 3600, times: [0, 0.16, 0.31, 0.46, 0.61, 0.75, 0.88, 1], ease: 'easeInOut',
      })
      if (await swing.finished && id === this.runId && !finish.disposed && !reducedMotion()) {
        finish.animate(art.cap, { rotate: [0, -5, 0, 5, 0] }, { duration: 3200, repeat: Infinity, ease: 'easeInOut' })
      }
    })
    return true
  }

}
