import test from 'node:test';
import assert from 'node:assert/strict';
function runCode(code, energy) {
  const queue = [];
  const api = {
    moveRight: () => queue.push({ kind: 'move', dx: 1, dy: 0 }),
    collect: () => queue.push({ kind: 'collect' }),
  };
  const runUserCode = new Function('moveRight', 'collect', code);
  runUserCode(api.moveRight, api.collect);
  return queue;
}
test('sequence builds queue', () => { assert.equal(runCode('moveRight();collect();', 100).length, 2); });
test('loop builds N', () => { assert.equal(runCode('for(let i=0;i<5;i++){moveRight();}', 100).length, 5); });
