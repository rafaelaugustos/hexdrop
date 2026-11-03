const assert = require('node:assert/strict')
const manifest = require('../package.json')
const lock = require('../package-lock.json')
assert.equal(manifest.dependencies['@rafaelaugusto/jolt'], '0.1.0-rc.11')
for (const [name, entry] of Object.entries(lock.packages)) {
  if (name.endsWith('node_modules/@rafaelaugusto/jolt')) assert.equal(entry.version, '0.1.0-rc.11')
  assert.ok(!name.includes('@getcortexlabs/mavis'), 'Mavis is not part of this project')
}
console.log('NativeScript-Vue + Jolt 0.1.0-rc.11. No Mavis dependency.')
