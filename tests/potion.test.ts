import test from 'node:test'
import assert from 'node:assert/strict'
import { shapePath, compatible } from '../node_modules/@rafaelaugusto/jolt/dist/core/shape-path.js'
import { BOTTLE, chainLinks, intersects, stars, stripes, swirl, transformedRect } from '../src/potion/geometry.ts'
import { EXAMPLE_FILE, MAX_FILE_BYTES, fileError, fileSize } from '../src/services/files.ts'

test('liquid and opening chain paths are compatible with the Jolt RC.11 native morph parser', () => {
  for (const [a, b] of [[swirl(0), swirl(2.7)], [swirl(2, -8), swirl(5.1, -8)]]) {
    assert.doesNotThrow(() => compatible(shapePath(a), shapePath(b)))
  }
  assert.doesNotThrow(() => compatible(shapePath(chainLinks()), shapePath(chainLinks(true))))
})

test('all composite artwork is accepted by the production path parser', () => {
  for (const path of [BOTTLE, chainLinks(), chainLinks(true), stars(), stripes()]) {
    const parsed = shapePath(path)
    assert.ok(parsed.points.length > 0)
    assert.ok(parsed.points.every(Number.isFinite))
  }
})

test('a drag only drops when its rectangle overlaps the vial target', () => {
  const target = { x: 20, y: 260, width: 320, height: 90 }
  assert.equal(intersects({ x: 30, y: 290, width: 280, height: 80 }, target), true)
  assert.equal(intersects({ x: 30, y: 530, width: 280, height: 80 }, target), false)
  assert.equal(intersects({ x: 350, y: 290, width: 50, height: 80 }, target), false)
  assert.equal(intersects({ x: 30, y: 350, width: 280, height: 80 }, target), false)
})

test('file selection rejects oversized/invalid files without rejecting the exact limit or empty files', () => {
  assert.equal(fileError(EXAMPLE_FILE), null)
  assert.equal(fileError({ name: 'empty.txt', size: 0 }), null)
  assert.equal(fileError({ name: 'limit.zip', size: MAX_FILE_BYTES }), null)
  for (const size of [MAX_FILE_BYTES + 1, NaN, Infinity, -1]) assert.ok(fileError({ name: 'invalid.zip', size }))
  assert.ok(fileError({ name: '  ', size: 1 }))
})

test('a scaled card does not accept a target beyond its visible bounds', () => {
  const card = { x: 20, y: 100, width: 300, height: 80 }
  const visible = transformedRect(card, { x: 0, y: -40 }, 0.8, 0)
  assert.deepEqual(visible, { x: 50, y: 68, width: 240, height: 64 })
  assert.equal(intersects(visible, { x: 291, y: 80, width: 20, height: 20 }), false)
  assert.equal(intersects(visible, { x: 280, y: 80, width: 20, height: 20 }), true)
})

test('rotation expands the drop bounds around the translated center', () => {
  const card = { x: 20, y: 100, width: 300, height: 80 }
  const visible = transformedRect(card, { x: 15, y: -30 }, 1, 90)
  assert.ok(Math.abs(visible.width - 80) < 1e-9)
  assert.ok(Math.abs(visible.height - 300) < 1e-9)
  assert.ok(Math.abs(visible.x + visible.width / 2 - 185) < 1e-9)
  assert.ok(Math.abs(visible.y + visible.height / 2 - 110) < 1e-9)
})

test('sizes remain readable from empty files to the example archive', () => {
  assert.equal(fileSize(0), '0 B')
  assert.equal(fileSize(1024), '1.0 KB')
  assert.equal(fileSize(EXAMPLE_FILE.size), '48.2 MB')
})
