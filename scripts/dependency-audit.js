#!/usr/bin/env node
/**
 * Dependency audit script for multi-package JS/TS repo and Android Gradle modules.
 * - Audits all package.json files using `npm audit --json`
 * - Lists available updates using `npm outdated --json`
 * - Scans Android Gradle files to list dependencies (manual review section)
 * - Writes a markdown report: dependency-audit-<YYYY-MM-DD>.md in repo root
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const TODAY = new Date();
const yyyy = TODAY.getFullYear();
const mm = String(TODAY.getMonth() + 1).padStart(2, '0');
const dd = String(TODAY.getDate()).padStart(2, '0');
const REPORT_NAME = `dependency-audit-${yyyy}-${mm}-${dd}.md`;
const REPORT_PATH = path.join(REPO_ROOT, REPORT_NAME);

function walk(dir, results = []) {
  const skipDirs = new Set([
    'node_modules', '.git', 'dist', 'build', '.expo', '.gradle', '.idea', '.android', '.ios', 'android\\build', 'android\\app\\build'
  ]);
  let list = [];
  try {
    list = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = path.relative(REPO_ROOT, full);
      if ([...skipDirs].some(s => rel.split(path.sep).includes(s))) continue;
      if (entry.name === 'node_modules') continue;
      walk(full, results);
    } else if (entry.isFile()) {
      if (entry.name === 'package.json') {
        // Skip generated sha files that masquerade or any inside android autolinking cache
        if (full.endsWith('package.json.sha')) continue;
        results.push(full);
      }
    }
  }
  return results;
}

function run(cmd, args, cwd) {
  try {
    const res = cp.spawnSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      timeout: 180000
    });
    return { code: res.status, stdout: res.stdout?.trim() || '', stderr: res.stderr?.trim() || '' };
  } catch (e) {
    return { code: 1, stdout: '', stderr: String(e) };
  }
}

function parseNpmAudit(jsonStr) {
  if (!jsonStr) return { items: [], error: 'empty' };
  let data;
  try { data = JSON.parse(jsonStr); } catch (e) { return { items: [], error: 'invalid_json' }; }
  const items = [];
  // npm v7+ format
  if (data && data.vulnerabilities) {
    for (const [name, vuln] of Object.entries(data.vulnerabilities)) {
      // Each vuln has via: array of strings or objects
      const vias = Array.isArray(vuln.via) ? vuln.via : [];
      for (const v of vias) {
        if (typeof v === 'string') {
          items.push({
            module: name,
            id: v,
            severity: vuln.severity || 'unknown',
            range: vuln.range || '',
            fixAvailable: (vuln.fixAvailable && (vuln.fixAvailable.version || vuln.fixAvailable)) || null,
            url: null
          });
        } else if (v && typeof v === 'object') {
          items.push({
            module: name,
            id: v.source || v.name || 'advisory',
            severity: v.severity || vuln.severity || 'unknown',
            range: v.range || vuln.range || '',
            fixAvailable: (v.fixAvailable && (v.fixAvailable.version || v.fixAvailable)) || (vuln.fixAvailable && (vuln.fixAvailable.version || vuln.fixAvailable)) || null,
            url: v.url || null,
            title: v.title || undefined
          });
        }
      }
    }
  }
  // npm v6 legacy advisories
  if (!items.length && data && data.advisories) {
    for (const [id, adv] of Object.entries(data.advisories)) {
      items.push({
        module: adv.module_name,
        id: adv.github_advisory_id || adv.cves?.[0] || id,
        severity: adv.severity,
        range: adv.vulnerable_versions,
        fixAvailable: adv.patched_versions || null,
        url: adv.url,
        title: adv.title
      });
    }
  }
  return { items };
}

function parseNpmOutdated(jsonStr) {
  if (!jsonStr) return {};
  try {
    const obj = JSON.parse(jsonStr);
    return obj || {};
  } catch (e) {
    return {};
  }
}

function semverMajorDiff(current, latest) {
  const sv = s => (s || '').replace(/^v/, '');
  const c = sv(current).split('.').map(Number);
  const l = sv(latest).split('.').map(Number);
  if (c.length < 3 || l.length < 3) return false;
  return l[0] > c[0];
}

function semverMinorOrPatchUpdate(current, wantedOrLatest) {
  const sv = s => (s || '').replace(/^v/, '');
  const c = sv(current).split('.').map(Number);
  const l = sv(wantedOrLatest).split('.').map(Number);
  if (c.length < 3 || l.length < 3) return false;
  return l[0] === c[0] && (l[1] > c[1] || (l[1] === c[1] && l[2] > c[2]));
}

function collectGradleDependencies() {
  const androidDir = path.join(REPO_ROOT, 'android');
  const files = [
    path.join(androidDir, 'build.gradle'),
    path.join(androidDir, 'app', 'build.gradle'),
    path.join(androidDir, 'gradle.properties'),
    path.join(androidDir, 'settings.gradle')
  ];
  const lines = [];
  for (const f of files) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const rel = path.relative(REPO_ROOT, f);
      const deps = [];
      const re1 = /\b(implementation|api|compileOnly|runtimeOnly|kapt|annotationProcessor)\s+['\"]([^'\"]+)['\"]/g;
      let m;
      while ((m = re1.exec(content))) {
        deps.push({ conf: m[1], coord: m[2] });
      }
      // Kotlin DSL style (not used here but just in case)
      const re2 = /\b(implementation|api|compileOnly|runtimeOnly)\(([^\)]+)\)/g;
      while ((m = re2.exec(content))) {
        const coord = m[2].replace(/["'\s]/g, '').trim();
        if (coord.includes(':')) deps.push({ conf: m[1], coord });
      }
      if (deps.length) {
        lines.push({ file: rel, deps });
      }
    }
  }
  return lines;
}

function writeReport(sections) {
  const out = [];
  out.push(`# Dependency Audit Report (${yyyy}-${mm}-${dd})`);
  out.push('');
  out.push('Scope: All detected package managers in this repository (npm/yarn/pnpm via package.json files, and Android Gradle).');
  out.push('This report includes security vulnerabilities (IDs, severity, fixed versions when available) and update availability.');
  out.push('Major version updates are listed but deferred due to potential breaking changes.');
  out.push('');
  for (const s of sections) {
    out.push(`## ${s.title}`);
    out.push('');
    out.push(s.body.trim());
    out.push('');
  }
  fs.writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

function main() {
  const pkgFiles = walk(REPO_ROOT).filter(p => !p.includes(`${path.sep}android${path.sep}build${path.sep}generated`));
  const sections = [];

  // Node package audits
  for (const pkgPath of pkgFiles) {
    const dir = path.dirname(pkgPath);
    const rel = path.relative(REPO_ROOT, dir) || '.';
    let pkg;
    try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch {}
    const hasLock = fs.existsSync(path.join(dir, 'package-lock.json')) || fs.existsSync(path.join(dir, 'pnpm-lock.yaml')) || fs.existsSync(path.join(dir, 'yarn.lock'));

    const auditRes = run('npm', ['audit', '--json', '--omit=dev'], dir);
    let vulnerabilities = [];
    let auditNote = '';
    if (auditRes.code === 0 || auditRes.stdout) {
      const parsed = parseNpmAudit(auditRes.stdout);
      vulnerabilities = parsed.items || [];
      if (parsed.error) auditNote = `(audit parse: ${parsed.error})`;
    } else {
      auditNote = `(audit failed: ${auditRes.stderr || 'unknown error'})`;
    }

    const outdatedRes = run('npm', ['outdated', '--json'], dir);
    const outdated = parseNpmOutdated(outdatedRes.stdout);

    const vulnLines = [];
    if (vulnerabilities.length) {
      // sort by severity
      const sevOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
      vulnerabilities.sort((a, b) => (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0));
      for (const v of vulnerabilities) {
        let fix = v.fixAvailable ? (typeof v.fixAvailable === 'string' ? v.fixAvailable : v.fixAvailable.version) : null;
        // Infer fixed version floor from affected range like "<1.2.3"
        if (!fix && v.range) {
          const m = /<\s*([0-9]+\.[0-9]+\.[0-9]+)/.exec(v.range);
          if (m) fix = `>=${m[1]}`;
        }
        vulnLines.push(`- ${v.module}: ${v.severity.toUpperCase()} — ${v.id}${v.title ? ' ('+v.title+')' : ''}${v.url ? ` — ${v.url}` : ''}${fix ? ` — fix available: ${fix}` : ''}${v.range ? ` — affected: ${v.range}` : ''}`);
      }
    } else {
      vulnLines.push('- No known vulnerabilities reported by npm audit.');
    }

    // Available updates
    const updLines = [];
    const batchCandidates = [];
    if (outdated && Object.keys(outdated).length) {
      const names = Object.keys(outdated).sort();
      for (const name of names) {
        const row = outdated[name];
        const current = row.current;
        const wanted = row.wanted || row.latest; // wanted stays on same major
        const latest = row.latest;
        // Skip if no actual update available
        if (!wanted || wanted === current) continue;
        const isMajor = latest && semverMajorDiff(current, latest);
        const note = isMajor ? 'BREAKING CHANGES POSSIBLE — defer' : 'safe to batch (subject to tests)';
        updLines.push(`- ${name}: ${current} → ${wanted}${latest && latest !== wanted ? ` (latest ${latest})` : ''} — ${note}`);
        if (!isMajor && wanted !== current) {
          batchCandidates.push({ name, from: current, to: wanted });
        }
      }
      if (!updLines.length) {
        updLines.push('- All dependencies up-to-date (per npm outdated).');
      }
    } else {
      updLines.push('- All dependencies up-to-date (per npm outdated).');
    }

    const body = [
      `Location: ${rel}${hasLock ? '' : ' (no lockfile detected — audit accuracy may be limited)'}`,
      '',
      'Vulnerabilities:',
      ...vulnLines,
      '',
      'Available updates:',
      ...updLines,
      '',
      batchCandidates.length ? `Batchable patch/minor updates (${batchCandidates.length}):\n` + batchCandidates.map(b => `  - ${b.name}: ${b.from} → ${b.to}`).join('\n') : 'No patch/minor updates to batch.'
    ].join('\n');

    sections.push({ title: `JavaScript/Node — ${pkg.name || path.basename(rel)}`, body });
  }

  // Gradle dependencies (Android)
  const gradleDeps = collectGradleDependencies();
  if (gradleDeps.length) {
    const lines = [];
    lines.push('Detected Gradle dependency coordinates (Android):');
    for (const f of gradleDeps) {
      lines.push(`- ${f.file}`);
      for (const d of f.deps) {
        lines.push(`  - [${d.conf}] ${d.coord}`);
      }
    }
    lines.push('');
    lines.push('Automated vulnerability scanning for Gradle is not enabled in this repo.');
    lines.push('To enable update reports: add the Gradle Versions Plugin and run `./gradlew dependencyUpdates`.');
    lines.push('To enable security scanning: integrate OWASP Dependency-Check or use GitHub Dependabot/Snyk.');
    sections.push({ title: 'Android (Gradle) — Dependencies Overview', body: lines.join('\n') });
  }

  writeReport(sections);
  console.log(`Wrote ${REPORT_PATH}`);
}

main();
