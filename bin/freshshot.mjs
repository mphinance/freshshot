#!/usr/bin/env node
// freshshot - keep your README screenshots fresh.

import { loadConfig } from '../src/config.mjs';
import { capture } from '../src/capture.mjs';

const HELP = `freshshot - keep your README screenshots fresh

Usage:
  freshshot [--config <path>] [--check]

Options:
  --config <path>   Config file to use (default: freshshot.config.json)
  --check           Report stale screenshots without writing; exit 1 if any.
  --help, -h        Show this help.
`;

function flagValue(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(HELP);
    return;
  }

  const check = process.argv.includes('--check');
  const configPath = flagValue('--config') || 'freshshot.config.json';

  const cfg = loadConfig(configPath);
  console.log(`freshshot: ${cfg.shots.length} shot(s) from ${configPath}`);

  const results = await capture(cfg, { check });

  let stale = 0;
  for (const r of results) {
    const pct = `${(r.ratio * 100).toFixed(3)}%`;
    if (r.status === 'new') {
      stale++;
      console.log(`  + ${r.name}  new`);
    } else if (r.status === 'changed') {
      stale++;
      console.log(`  ~ ${r.name}  changed (${pct})`);
    } else {
      console.log(`  = ${r.name}  unchanged (${pct})`);
    }
  }

  if (check) {
    if (stale > 0) {
      console.error(`\n${stale} screenshot(s) are out of date. Run freshshot to refresh them.`);
      process.exit(1);
    }
    console.log('\nAll screenshots are current.');
    return;
  }
  console.log(stale > 0
    ? `\n${stale} screenshot(s) refreshed.`
    : '\nNo changes - every screenshot is already current.');
}

main().catch((err) => {
  console.error('freshshot: ' + err.message);
  process.exit(1);
});
