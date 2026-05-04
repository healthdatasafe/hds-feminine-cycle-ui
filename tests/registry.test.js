import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, femmSpec } from '../js/index.js';

test('femm is registered by default', () => {
  assert.ok(registry.has('femm'));
  const rep = registry.get('femm');
  assert.equal(rep.spec.id, 'femm');
  assert.equal(rep.spec.primitive, 'dot-circle');
});

test('list returns at least the FEMM built-in', () => {
  const all = registry.list();
  assert.ok(all.length >= 1);
  assert.ok(all.some((r) => r.spec.id === 'femm'));
});

test('resolveColor maps palette keys to hex', () => {
  const rep = registry.get('femm');
  assert.equal(rep.resolveColor('dry'), '#A8A8A8');
  assert.equal(rep.resolveColor('peak'), '#1F3B7A');
});

test('resolveColor passes unknown keys through (raw hex support)', () => {
  const rep = registry.get('femm');
  assert.equal(rep.resolveColor('#FFFFFF'), '#FFFFFF');
  assert.equal(rep.resolveColor('not-a-palette-key'), 'not-a-palette-key');
});

test('register accepts a new spec', () => {
  const fake = {
    ...femmSpec,
    id: 'test-fake',
    label: { en: 'Test' }
  };
  registry.register(fake);
  assert.ok(registry.has('test-fake'));
  assert.equal(registry.get('test-fake').spec.id, 'test-fake');
});
