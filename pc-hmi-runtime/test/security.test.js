const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ProjectService } = require('../server/services/project-service');
const { UserService } = require('../server/services/user-service');
const { GroupService } = require('../server/services/group-service');

function makeUsers() {
  const groups = new GroupService([
    { id: 'administrators', name: 'Administrators', level: 3, builtIn: true },
    { id: 'operators', name: 'Operators', level: 1, builtIn: true }
  ]);
  return new UserService([
    { username: 'admin', password: 'admin', groups: ['administrators'] },
    { username: 'operator', password: 'operator', groups: ['operators'] }
  ], groups);
}

test('project and screen ids cannot leave the projects folder', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plant-hmi-security-'));
  fs.mkdirSync(path.join(rootDir, 'projects', 'a', 'Gfx'), { recursive: true });
  const service = new ProjectService(rootDir);

  for (const id of ['..', '../..', '..\\..', 'C:', '']) {
    assert.equal(service.projectExists(id), false, `projectExists(${JSON.stringify(id)})`);
    assert.throws(() => service.projectPath(id), /Invalid project id/);
  }
  assert.throws(() => service.screenFilePath('a', '../../package'), /Invalid screen id/);
  assert.throws(() => service.globalObjectFilePath('a', '..\\x'), /Invalid global object id/);
  assert.throws(() => service.deleteProject('..'), /Project not found/);
  assert.equal(service.projectPath('a'), path.join(rootDir, 'projects', 'a'));
});

test('a login only applies to the session that made it', () => {
  const users = makeUsers();
  const login = UserService.runWithSession('', () => users.login('admin', 'admin'));
  assert.equal(login.success, true);
  assert.ok(login.token);

  UserService.runWithSession(login.token, () => {
    assert.equal(users.getCurrentUser().username, 'admin');
    assert.equal(users.canAccess(3), true);
  });
  for (const other of ['', 'someone-elses-token']) {
    UserService.runWithSession(other, () => {
      assert.equal(users.getCurrentUser(), null);
      assert.equal(users.canAccess(1), false);
      assert.equal(users.canAccess(0), true);
    });
  }

  UserService.runWithSession(login.token, () => users.logout());
  UserService.runWithSession(login.token, () => assert.equal(users.getCurrentUser(), null));
});

test('failed login leaves the existing session alone', () => {
  const users = makeUsers();
  const { token } = users.login('operator', 'operator');
  UserService.runWithSession(token, () => {
    assert.equal(users.login('operator', 'wrong').success, false);
    assert.equal(users.getCurrentUser().username, 'operator');
  });
});

test('disabling or deleting a user ends their sessions', () => {
  const users = makeUsers();
  const { token } = users.login('operator', 'operator');
  UserService.runWithSession(token, () => {
    const result = users.setUserEnabled({ username: 'operator', enabled: false });
    assert.equal(result.loggedOutSelf, true);
    assert.equal(users.getCurrentUser(), null);
  });
  users.setUserEnabled({ username: 'operator', enabled: true });
  assert.equal(users.userForToken(token), null, 'old token stays dead after re-enabling');

  const again = users.login('operator', 'operator');
  users.deleteUser({ username: 'operator' });
  assert.equal(users.userForToken(again.token), null);
});

test('session level follows group edits live', () => {
  const users = makeUsers();
  const { token } = users.login('operator', 'operator');
  users.modifyGroup({ username: 'operator', groups: ['administrators'] });
  assert.equal(users.userForToken(token).level, 3);
});

test('passwords are stored hashed and still verify', () => {
  const users = makeUsers();
  users.addUser({ username: 'newbie', password: 'secret1' });
  const stored = users.findUser('newbie').password;
  assert.match(stored, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  assert.equal(users.login('newbie', 'secret1').success, true);
  assert.equal(users.login('newbie', 'wrong').success, false);

  users.changePassword({ username: 'newbie', password: 'secret2' });
  assert.notEqual(users.findUser('newbie').password, stored);
  assert.equal(users.login('newbie', 'secret1').success, false);
  assert.equal(users.login('newbie', 'secret2').success, true);
});

test('plain-text passwords from older projects log in and migrate to hashes', () => {
  const users = makeUsers();
  assert.equal(users.login('admin', 'admin').success, true);
  const result = UserService.migratePasswords(users.users);
  assert.equal(result.changed, true);
  for (const user of users.users) assert.match(user.password, /^scrypt\$/);
  assert.equal(users.login('admin', 'admin').success, true);
  assert.equal(users.login('admin', 'nope').success, false);
  assert.equal(UserService.migratePasswords(users.users).changed, false, 'already hashed');
});

test('login responses never include the password', () => {
  const users = makeUsers();
  const result = users.login('admin', 'admin');
  assert.equal('password' in result.user, false);
});

const { TagLogicService } = require('../server/services/tag-logic-service');

function logicService(rules) {
  const service = new TagLogicService({ tags: new Map() });
  service.loadRules(rules);
  return service;
}

test('tag logic fallback evaluates real rules', () => {
  const chain = JSON.stringify(['A', 'B']);
  const service = logicService([
    { name: 'All', logic: `all(tags.get(n, False) for n in ${chain})` },
    { name: 'One', logic: "tags.get('A', False)" },
    { name: 'Num', type: 'int', logic: "tags['N'] * 2 + 1" }
  ]);
  const out = service.runJsFallback({ A: true, B: false, N: 5 });
  assert.deepEqual([out.All, out.One, out.Num], [false, true, 11]);
});

test('tag logic fallback refuses code that escapes the expression', () => {
  const attacks = [
    "process.exit(1)",
    "require('child_process')",
    "tags['A']['constructor']['constructor']('return process')()",
    "tags.constructor",
    "(x = 1)",
    "`${1}`",
    "Math.max.call.apply",
    "globalThis",
    "(() => { return 1; })()"
  ];
  const service = logicService(attacks.map((logic, i) => ({ name: `R${i}`, logic })));
  const out = service.runJsFallback({ A: true });
  for (let i = 0; i < attacks.length; i++) {
    assert.ok(out[`R${i}`]?.error, `should reject: ${attacks[i]}`);
  }
});
