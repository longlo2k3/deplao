#!/usr/bin/env node
/**
 * rebuild-native.js
 *
 * Downloads prebuilt native binaries for Electron (no Visual Studio needed).
 * Currently handles: better-sqlite3
 *
 * Usage: node scripts/rebuild-native.js
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const electronVersion = require('electron/package.json').version;

const modules = [
  { name: 'better-sqlite3', dir: 'node_modules/better-sqlite3' },
];

for (const mod of modules) {
  const cwd = path.resolve(__dirname, '..', mod.dir);
  console.log(`\n🔧 Rebuilding ${mod.name} for Electron ${electronVersion}...`);

  try {
    execSync(`npx prebuild-install --runtime electron --target ${electronVersion}`, {
      cwd,
      stdio: 'inherit',
    });
    console.log(`✅ ${mod.name} rebuilt successfully`);
  } catch (err) {
    console.error(`❌ Failed to rebuild ${mod.name}:`, err.message);
    process.exit(1);
  }
}

console.log('\n✅ All native modules rebuilt for Electron');
