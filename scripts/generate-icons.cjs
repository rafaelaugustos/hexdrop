#!/usr/bin/env node
// Requires ImageMagick. Generated assets are checked in; normal builds do not run this.
const { execFileSync } = require('node:child_process')
const { mkdirSync, writeFileSync, existsSync } = require('node:fs')
const { resolve, dirname } = require('node:path')

const root = resolve(__dirname, '..')
const source = resolve(root, 'resources/branding/hexdrop-mark.png')
const background = '#0a090e'
if (!existsSync(source)) throw new Error(`Missing icon artwork: ${source}`)

function write(file, data) {
  const target = resolve(root, file)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`)
}

function render(file, size, { opaque = false, inset = 0, monochrome = false } = {}) {
  const target = resolve(root, file)
  mkdirSync(dirname(target), { recursive: true })
  const content = Math.round(size * (1 - inset * 2))
  const args = [source, '-resize', `${content}x${content}`, '-gravity', 'center',
    '-background', 'none', '-extent', `${size}x${size}`]
  if (monochrome) args.push('-fill', 'white', '-colorize', '100')
  if (opaque) args.push('-background', background, '-alpha', 'remove', '-alpha', 'off')
  args.push('-strip', target)
  execFileSync('magick', args)
}

render('src/assets/hexdrop-mark.png', 660)
render('resources/branding/hexdrop-icon.png', 1024, { opaque: true })

const ios = 'App_Resources/iOS/Assets.xcassets'
const info = { version: 1, author: 'xcode' }
write(`${ios}/Contents.json`, { info })
const icons = []
for (const [idiom, sizes, scales] of [
  ['iphone', [20, 29, 40, 60], [2, 3]],
  ['ipad', [20, 29, 40, 76], [1, 2]],
  ['ipad', [83.5], [2]],
  ['ios-marketing', [1024], [1]],
]) {
  for (const size of sizes) for (const scale of scales) {
    const pixels = size * scale
    const filename = `icon-${pixels}.png`
    render(`${ios}/AppIcon.appiconset/${filename}`, pixels, { opaque: true })
    icons.push({ idiom, size: `${size}x${size}`, scale: `${scale}x`, filename })
  }
}
write(`${ios}/AppIcon.appiconset/Contents.json`, { images: icons, info })
const launch = [1, 2, 3].map(scale => {
  const filename = `launch-mark@${scale}x.png`
  render(`${ios}/LaunchMark.imageset/${filename}`, 220 * scale)
  return { idiom: 'universal', filename, scale: `${scale}x` }
})
write(`${ios}/LaunchMark.imageset/Contents.json`, { images: launch, info })

const android = 'App_Resources/Android/src/main/res'
for (const [density, scale] of [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]]) {
  render(`${android}/mipmap-${density}/ic_launcher.png`, 48 * scale, { opaque: true })
  render(`${android}/drawable-${density}/ic_launcher_foreground.png`, 108 * scale, { inset: 0.15 })
  render(`${android}/drawable-${density}/ic_launcher_monochrome.png`, 108 * scale, { inset: 0.15, monochrome: true })
}
render(`${android}/drawable-nodpi/launch_mark.png`, 660)
console.log('Generated iOS icons, Android adaptive/legacy icons, and launch artwork.')
