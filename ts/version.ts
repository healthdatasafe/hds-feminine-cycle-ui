/**
 * This package's version, used by the registry to keep the newest copy's built-in specs when several copies of the
 * package are loaded in one page (B-2026-11-20-15). A constant rather than a `package.json` import: hosts compile
 * `ts/` directly and `package.json` is outside `rootDir`. `tests/version.test.js` fails when it drifts from
 * `package.json`, so bump both together.
 */
export const PACKAGE_VERSION = '0.20.1';
