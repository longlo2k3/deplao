/**
 * strip-console.js
 * Xóa toàn bộ console.* khỏi các file JS đã compile trong dist-electron/
 * Production không có devtools nên console.* vô nghĩa, chỉ tốn stdout I/O.
 * Chạy sau khi `tsc` compile electron main process.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist-electron');

// Pattern xóa: toàn bộ console.* (log/warn/info/debug/trace/error/dir/...)
// Production không có devtools, giữ lại cũng vô nghĩa, chỉ tốn stdout I/O
const CONSOLE_PATTERNS = [
  /console\.\w+\s*\([^;]*\)\s*;?/g,
];

function stripConsoleFromCode(code) {
  let result = code;
  for (const pattern of CONSOLE_PATTERNS) {
    result = result.replace(pattern, '/* [stripped] */');
  }
  return result;
}

function findJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findJsFiles(full));
    } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.map')) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const files = findJsFiles(DIST_DIR);
  if (files.length === 0) {
    console.warn('[strip-console] No JS files found in dist-electron/');
    return;
  }

  let stripped = 0;
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const processed = stripConsoleFromCode(original);
    if (processed !== original) {
      fs.writeFileSync(file, processed, 'utf8');
      stripped++;
    }
  }

  console.log(`[strip-console] Done: ${stripped}/${files.length} files modified.`);
}

main();

