const fs = require('node:fs');
const path = require('node:path');
const excluded = new Set(['node_modules', '.git', '.cache', 'coverage', '.office-data']);
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name) || (entry.name.startsWith('.env') && entry.name !== '.env.example')) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename); else files.push(filename);
  }
}
walk('.');
// Compare actual configured values without ever logging their contents.
const privateEnv = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const secrets = [...privateEnv.matchAll(/^([A-Z][A-Z0-9_]*(?:API_KEY|ACCESS_TOKEN|SECRET|PASSWORD))=(.+)$/gm)]
  .map(match => match[2].trim().replace(/^['"]|['"]$/g, '')).filter(value => value.length > 10);
const pattern = /(?:sk-or-v1-[a-f0-9]{32,}|github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const hits = files.filter(filename => {
  const content = fs.readFileSync(filename);
  return secrets.some(value => content.includes(Buffer.from(value))) || pattern.test(content.toString('utf8'));
});
if (hits.length) { console.error('FAIL: Possible secrets found in:', hits.join(', ')); process.exitCode = 1; }
else console.log(`PASS: No configured secrets or credential patterns found in ${files.length} source/build files. Private environment files excluded.`);
