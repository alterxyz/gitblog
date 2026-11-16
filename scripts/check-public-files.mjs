import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Inspect Git path metadata only. Never open local keys or folder records.
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const forbidden = name => name.split('/').some(part =>
  ['regent-consulate', 'office-of-regent-managed-folder', '.regent-of-folders', '.local', 'regent-managed-folder.md'].includes(part)
  || part.endsWith('.regent-managed-folder') || part.endsWith('.folder-readme'));
const inspect = (paths, label) => {
  const blocked = paths.filter(Boolean).filter(forbidden);
  if (blocked.length) throw new Error(`${label} contains private local paths:\n${blocked.join('\n')}`);
};
const inspectCommits = commits => {
  const unique = [...new Set(commits)];
  if (unique.length > 200) throw new Error('More than 200 commits; perform a bounded privacy review before publication.');
  for (const commit of unique) {
    inspect(git('ls-tree', '-r', '--name-only', '-z', commit).split('\0'), commit.slice(0, 12));
  }
};

try {
  if (process.argv.includes('--pre-push')) {
    const lines = readFileSync(0, 'utf8').trim().split('\n').filter(Boolean);
    const seen = new Set();
    for (const line of lines) {
      const [ref, sha] = line.split(/\s+/);
      if (ref.startsWith('refs/heads/local/')) throw new Error('Local-only history branches must not be pushed.');
      if (/^0+$/.test(sha)) continue;
      // Include every unpublished commit, including files later deleted again.
      const commits = git('rev-list', '--max-count=201', sha, '--not', '--remotes=origin').trim().split('\n').filter(Boolean);
      inspectCommits(commits.filter(commit => !seen.has(commit)));
      commits.forEach(commit => seen.add(commit));
    }
    console.log('Public-path check passed for unpublished history.');
  } else {
    inspect(git('ls-files', '--cached', '-z').split('\0'), 'Git index');
    if (process.argv.includes('--ci-history')) {
      const head = process.env.HEAD_REV;
      const base = process.env.BASE_REV;
      const defaultBranch = process.env.DEFAULT_BRANCH;
      if (!/^[0-9a-f]{40}$/.test(head ?? '')) throw new Error('Missing or invalid CI head revision.');
      if (base && !/^[0-9a-f]{40}$/.test(base)) throw new Error('Invalid CI base revision.');
      // Runs without a base (manual, issue events) inspect HEAD only. Push and
      // PR runs inspect the newly introduced range. A new branch or tag has an
      // all-zero base: inspect what the default branch does not contain yet.
      let range = ['--max-count=1', head];
      if (base && /^0+$/.test(base)) {
        if (!defaultBranch) throw new Error('Missing default branch for a new branch or tag.');
        range = ['--max-count=201', head, `^refs/remotes/origin/${defaultBranch}`];
      } else if (base) {
        range = ['--max-count=201', head, `^${base}`];
      }
      // The head commit is always inspected, even when the range is empty.
      inspectCommits([head, ...git('rev-list', ...range).trim().split('\n').filter(Boolean)]);
      console.log('Public-path check passed for the CI commit range.');
    }
    console.log('Public-path check passed for the Git index.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
