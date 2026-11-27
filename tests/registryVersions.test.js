import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registry, femmSpec, creightonSpec } from '../js/index.js';
import { createRegistry, versionAware, compareVersions } from '../js/registry.js';
import { PACKAGE_VERSION } from '../js/version.js';

// B-2026-11-20-15: every copy of the package in a page shares one registry; the newest copy's spec must win.

const v1 = { ...femmSpec, id: 'dup', label: { en: 'Old' } };
const v2 = { ...femmSpec, id: 'dup', label: { en: 'New' } };

function silenceWarn (t) {
  return t.mock.method(console, 'warn', () => {});
}

test('PACKAGE_VERSION matches package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(PACKAGE_VERSION, pkg.version);
});

test('compareVersions: semver order, a missing version is the oldest', () => {
  assert.equal(compareVersions('0.20.1', '0.11.1'), 1);
  assert.equal(compareVersions('0.9.0', '0.10.0'), -1);
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('1.0.0-rc.1', '1.0.0'), -1);
  assert.equal(compareVersions(undefined, '0.0.1'), -1);
  assert.equal(compareVersions('0.0.1', undefined), 1);
  assert.equal(compareVersions(undefined, undefined), 0);
});

test('newer then older keeps the newer, and warns once', (t) => {
  const warn = silenceWarn(t);
  const r = createRegistry();
  r.register(v2, '0.20.1');
  r.register(v1, '0.11.1');
  assert.equal(r.get('dup').spec.label.en, 'New');
  assert.equal(warn.mock.callCount(), 1);
  const message = warn.mock.calls[0].arguments[0];
  assert.match(message, /"dup"/);
  assert.match(message, /0\.20\.1/);
  assert.match(message, /0\.11\.1/);
  r.register(v1, '0.11.1');
  assert.equal(warn.mock.callCount(), 1, 'the same conflict warns once');
});

test('older then newer keeps the newer, and warns', (t) => {
  const warn = silenceWarn(t);
  const r = createRegistry();
  r.register(v1, '0.11.1');
  r.register(v2, '0.20.1');
  assert.equal(r.get('dup').spec.label.en, 'New');
  assert.equal(warn.mock.callCount(), 1);
});

test('the same spec registered again is silent', (t) => {
  const warn = silenceWarn(t);
  const r = createRegistry();
  r.register(v2, '0.20.1');
  r.register({ ...v2 }, '0.20.1');
  r.register(v2, '0.11.1');
  r.register(v2);
  assert.equal(r.get('dup').spec.label.en, 'New');
  assert.equal(warn.mock.callCount(), 0);
});

test('unversioned is older than versioned, in either order', (t) => {
  const warn = silenceWarn(t);
  const a = createRegistry();
  a.register(v2, '0.20.1');
  a.register(v1);
  assert.equal(a.get('dup').spec.label.en, 'New');
  const b = createRegistry();
  b.register(v1);
  b.register(v2, '0.0.1');
  assert.equal(b.get('dup').spec.label.en, 'New');
  assert.equal(warn.mock.callCount(), 2);
  assert.match(warn.mock.calls[0].arguments[0], /unversioned/);
});

test('same version, different content: the last one wins, with a warning', (t) => {
  const warn = silenceWarn(t);
  const r = createRegistry();
  r.register(v1, '0.20.1');
  r.register(v2, '0.20.1');
  assert.equal(r.get('dup').spec.label.en, 'New');
  assert.equal(warn.mock.callCount(), 1);
  const u = createRegistry();
  u.register(v1);
  u.register(v2);
  assert.equal(u.get('dup').spec.label.en, 'New');
  assert.equal(warn.mock.callCount(), 2);
});

test('an instance created by an older copy (plain overwrite) is made version-aware', (t) => {
  silenceWarn(t);
  class OldRegistry {
    #byId = new Map();
    register (spec) { this.#byId.set(spec.id, { spec, resolveColor: (k) => k }); }
    get (id) { return this.#byId.get(id); }
    has (id) { return this.#byId.has(id); }
    list () { return Array.from(this.#byId.values()); }
  }
  const shared = new OldRegistry();
  shared.register(v1);
  versionAware(shared);
  assert.equal(versionAware(shared), shared, 'idempotent');
  shared.register(v2, '0.20.1');
  assert.equal(shared.get('dup').spec.label.en, 'New');
  shared.register(v1);
  assert.equal(shared.get('dup').spec.label.en, 'New', 'a stale copy loading later no longer wins');
});

test('the page-wide registry keeps its built-in when a stale copy registers the same id later', (t) => {
  const warn = silenceWarn(t);
  const stale = { ...creightonSpec, label: { en: 'Creighton (stale)' } };
  registry.register(stale);
  assert.equal(registry.get('creighton').spec, creightonSpec);
  assert.equal(warn.mock.callCount(), 1);
  registry.register(creightonSpec, PACKAGE_VERSION);
  assert.equal(warn.mock.callCount(), 1);
});
