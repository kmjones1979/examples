/* eslint-disable no-console */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const MAIN_README_PATH = path.join(REPO_ROOT, 'README.md');
const SUBGRAPHS_PATH = path.join(REPO_ROOT, 'subgraphs');

/**
 * Returns last commit date (YYYY-MM-DD) that touched given path relative to repo root.
 */
function gitLastChanged(targetPathInRepo) {
  try {
    // Ensure path is relative to repo root for the git command
    const absoluteTargetPath = path.resolve(REPO_ROOT, targetPathInRepo);
    const relativePathForGit = path.relative(REPO_ROOT, absoluteTargetPath);

    const command = `git log -1 --format=%cs -- "${relativePathForGit}"`;
    const out = execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: REPO_ROOT, // Run git command from repo root
    });
    return out.trim();
  } catch (error) {
    console.warn(`Could not get git last changed date for ${targetPathInRepo}: ${error.message}`);
    return null;
  }
}

// Pass 1: Update the main README.md
console.log(`Processing main README: ${MAIN_README_PATH}`);
const mainReadmeContent = fs.readFileSync(MAIN_README_PATH, 'utf8');
const mainReadmeLines = mainReadmeContent.split(/\r?\n/);
const updatedMainReadmeLines = mainReadmeLines.map((line) => {
  const match = line.match(/\]\((\.\/[^)]+)\):(.+)/);
  if (!match) return line;

  const mdPath = match[1]; // e.g., ./subgraphs/basic-examples/near/blocks-example
  const description = match[2];
  const descClean = description.replace(/\s*\(last updated .*?\)/i, '').trimEnd();

  const lastDate = gitLastChanged(mdPath.startsWith('./') ? mdPath.substring(2) : mdPath);
  if (!lastDate) return line;

  return `${line.replace(description, descClean)} (last updated ${lastDate})`;
});
fs.writeFileSync(MAIN_README_PATH, updatedMainReadmeLines.join('\n'));
console.log('Main README dates processed.');

// Pass 2: Update README.md files in subgraphs subdirectories
console.log(`Searching for sub-READMEs in: ${SUBGRAPHS_PATH}`);
function findSubReadmeFiles(startPath) {
  let results = [];
  const files = fs.readdirSync(startPath);
  for (const file of files) {
    const filepath = path.join(startPath, file);
    const stat = fs.lstatSync(filepath);
    if (stat.isDirectory()) {
      // Exclude build/dist or other non-source directories if needed, e.g. by checking file name
      if (file === 'build' || file === 'dist' || file === '.git' || file === 'node_modules') continue;
      results = results.concat(findSubReadmeFiles(filepath));
    } else if (path.basename(filepath) === 'README.md') {
      results.push(filepath);
    }
  }
  return results;
}

const subReadmeFiles = findSubReadmeFiles(SUBGRAPHS_PATH);

for (const subReadmePath of subReadmeFiles) {
  console.log(`Processing sub-README: ${subReadmePath}`);
  const exampleFolderPath = path.dirname(subReadmePath);
  // Make exampleFolderPath relative to REPO_ROOT for gitLastChanged
  const relativeExampleFolderPath = path.relative(REPO_ROOT, exampleFolderPath);

  const lastDate = gitLastChanged(relativeExampleFolderPath);
  if (!lastDate) {
    console.warn(`  Skipping update for ${subReadmePath} as date could not be determined.`);
    continue;
  }

  const subReadmeContent = fs.readFileSync(subReadmePath, 'utf8');
  const subReadmeLines = subReadmeContent.split(/\r?\n/);
  let modified = false;
  const updatedSubReadmeLines = subReadmeLines.map((line) => {
    if (line.startsWith('> **Last updated:**')) {
      modified = true;
      return `> **Last updated:** ${lastDate}`;
    }
    return line;
  });

  if (modified) {
    fs.writeFileSync(subReadmePath, updatedSubReadmeLines.join('\n'));
    console.log(`  Updated date in ${subReadmePath}`);
  } else {
    console.log(`  Placeholder '> **Last updated:**' not found in ${subReadmePath}. No update made.`);
  }
}

console.log('All README date processing finished.'); 