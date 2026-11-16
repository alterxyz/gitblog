// Run with: node --test scripts/check-public-files.test.mjs
// Every scenario uses throwaway repositories in the system temp directory.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-public-files.mjs');
const zero = '0'.repeat(40);
const root = mkdtempSync(join(tmpdir(), 'public-path-check-'));
after(() => rmSync(root, { recursive: true, force: true }));

const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' };
delete env.BASE_REV; delete env.HEAD_REV; delete env.DEFAULT_BRANCH;

let count = 0;
// A clone of a bare "origin" whose master already has `history` extra commits.
const makeRepo = (history = 0) => {
  const dir = join(root, String(count++));
  const remote = `${dir}-origin.git`;
  const git = (...args) => execFileSync('git', args, { cwd: dir, env, encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '-b', 'master', remote], { env });
  execFileSync('git', ['clone', '-q', remote, dir], { env, stdio: 'ignore' });
  const repo = {
    dir, git,
    commit(path, message = path) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), message);
      git('add', path);
      git('commit', '-q', '-m', message);
      return git('rev-parse', 'HEAD');
    },
    remove(path) {
      git('rm', '-q', path);
      git('commit', '-q', '-m', `remove ${path}`);
      return git('rev-parse', 'HEAD');
    },
    run(args, extraEnv = {}, input = '') {
      return spawnSync(process.execPath, [script, ...args],
        { cwd: dir, env: { ...env, ...extraEnv }, input, encoding: 'utf8' });
    },
  };
  repo.commit('README.md');
  let tip = git('rev-parse', 'HEAD');
  const tree = git('rev-parse', 'HEAD^{tree}');
  for (let i = 0; i < history; i++) tip = git('commit-tree', tree, '-p', tip, '-m', `c${i}`);
  git('update-ref', 'refs/heads/master', tip);
  git('push', '-q', 'origin', 'master');
  return repo;
};
// Simulate a CI checkout: the new ref is on origin and fetched, HEAD is its tip.
const publish = (repo, branch) => {
  repo.git('push', '-q', 'origin', branch);
  repo.git('fetch', '-q', 'origin');
  return repo.git('rev-parse', 'HEAD');
};
const ci = (repo, base, head, extra = {}) =>
  repo.run(['--ci-history'], { BASE_REV: base, HEAD_REV: head, DEFAULT_BRANCH: 'master', ...extra });
const passes = result => assert.equal(result.status, 0, result.stderr);
const fails = (result, pattern) => {
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, pattern);
};

test('CI: a new branch on a long-history repository passes', () => {
  const repo = makeRepo(250);
  repo.git('switch', '-q', '-c', 'feature');
  repo.commit('docs/note.md');
  passes(ci(repo, zero, publish(repo, 'feature')));
});

test('CI: a new branch that added and removed a private path fails', () => {
  const repo = makeRepo();
  repo.git('switch', '-q', '-c', 'feature');
  repo.commit('.local/backups/x.md');
  repo.remove('.local/backups/x.md');
  fails(ci(repo, zero, publish(repo, 'feature')), /private local paths/);
});

test('CI: a new branch with more than 200 new commits fails closed', () => {
  const repo = makeRepo();
  repo.git('switch', '-q', '-c', 'feature');
  const tree = repo.git('rev-parse', 'HEAD^{tree}');
  let tip = repo.git('rev-parse', 'HEAD');
  for (let i = 0; i < 205; i++) tip = repo.git('commit-tree', tree, '-p', tip, '-m', `f${i}`);
  repo.git('update-ref', 'refs/heads/feature', tip);
  repo.git('reset', '-q', '--hard', tip);
  fails(ci(repo, zero, publish(repo, 'feature')), /More than 200 commits/);
});

test('CI: a new branch without a default branch fails closed', () => {
  const repo = makeRepo();
  repo.git('switch', '-q', '-c', 'feature');
  repo.commit('docs/note.md');
  fails(ci(repo, zero, publish(repo, 'feature'), { DEFAULT_BRANCH: '' }), /Missing default branch/);
});

test('CI: a pushed range with a private path in the middle fails', () => {
  const repo = makeRepo();
  const base = repo.git('rev-parse', 'HEAD');
  repo.commit('regent-consulate/board.toml');
  repo.remove('regent-consulate/board.toml');
  fails(ci(repo, base, publish(repo, 'master')), /private local paths/);
});

test('CI: a clean pushed range and a run without a base pass', () => {
  const repo = makeRepo(250);
  const base = repo.git('rev-parse', 'HEAD');
  repo.commit('static/page.html');
  const head = publish(repo, 'master');
  passes(ci(repo, base, head));
  passes(ci(repo, '', head));
});

test('CI: a tracked private path fails the index check', () => {
  const repo = makeRepo();
  repo.commit('notes.folder-readme');
  fails(repo.run([]), /Git index contains private local paths/);
});

test('pre-push: unpublished history is checked and local/ branches are blocked', () => {
  const repo = makeRepo(250);
  repo.git('switch', '-q', '-c', 'feature');
  const clean = repo.commit('docs/note.md');
  passes(repo.run(['--pre-push'], {}, `refs/heads/feature ${clean} refs/heads/feature ${zero}\n`));
  repo.commit('a/.regent-of-folders/state');
  const dirty = repo.remove('a/.regent-of-folders/state');
  fails(repo.run(['--pre-push'], {}, `refs/heads/feature ${dirty} refs/heads/feature ${zero}\n`),
    /private local paths/);
  fails(repo.run(['--pre-push'], {}, `refs/heads/local/x ${clean} refs/heads/local/x ${zero}\n`),
    /Local-only history branches/);
});
