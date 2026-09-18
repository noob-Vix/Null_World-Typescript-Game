import test from 'node:test';
import assert from 'node:assert/strict';
function runCode(code, energy) {
  const q = [];
  const api = {
    moveRight: () => q.push({ kind: 'move', dx: 1, dy: 0 }),
    collect: () => q.push({ kind: 'collect' }),
  };
  const fn = new Function('moveRight', 'collect', code);
  fn(api.moveRight, api.collect);
  return q;
}
test('sequence builds queue', () => { assert.equal(runCode('moveRight();collect();', 100).length, 2); });
test('loop builds N', () => { assert.equal(runCode('for(let i=0;i<5;i++){moveRight();}', 100).length, 5); });
