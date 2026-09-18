import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Regression: Door must be energy-gated, not a permanent wall.
// Reads the real source so the test fails before the fix.
const src = fs.readFileSync(new URL('../src/game/world.ts', import.meta.url), 'utf8');
test('door is passable when energy>0 (not a permanent wall)', () => {
  const doorLine = src.split('\n').find(l => l.includes('Tile.Door'));
  assert.ok(doorLine, 'Door branch must exist');
  assert.ok(/energy/i.test(src), 'world.ts must reference energy for Door gating');
  assert.ok(!/Wall \|\| .*Door.*return 'bump: blocked'/.test(src), 'Door must not share Wall unconditional block');
});
