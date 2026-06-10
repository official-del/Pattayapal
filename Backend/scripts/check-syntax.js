import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(__filename), '..');
const ignoredDirs = new Set(['node_modules', 'dist', 'uploads']);

const findJavaScriptFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...await findJavaScriptFiles(fullPath));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
};

const checkFile = (file) => new Promise((resolve, reject) => {
  execFile(process.execPath, ['--check', file], (error, stdout, stderr) => {
    if (error) {
      reject(new Error(`${file}\n${stdout}${stderr}`));
      return;
    }
    resolve();
  });
});

const files = await findJavaScriptFiles(backendRoot);
for (const file of files) {
  await checkFile(file);
}

console.log(`Syntax check passed for ${files.length} Backend JavaScript files.`);
