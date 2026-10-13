require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const manager = require('../routes/lib/sseClientsListManager');

test.beforeEach(() => {
  manager.clients.clear();
});

test('addActivityAndUserToMap stores a client entry', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'teacher', 'client-1', 'user-1');

  const stored = manager.clients.get('client-1');
  assert.equal(stored.id, 'study-1');
  assert.equal(stored.user, 'alice');
  assert.equal(stored.userRole, 'teacher');
  assert.equal(stored.userId, 'user-1');
  assert.equal(typeof stored.lastTime, 'number');
});

test('addGroupAndUserToMap stores a client entry', () => {
  manager.addGroupAndUserToMap('group-1', 'bob', 'student', 'client-1', 'user-2');
  assert.equal(manager.clients.get('client-1').id, 'group-1');
});

test('getClientList returns teachers watching the study', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'teacher', 'teacher-1', 'user-1');
  assert.deepEqual(manager.getClientList({ studyId: 'study-1' }), ['teacher-1']);
});

test('getClientList returns teachers watching the group', () => {
  manager.addGroupAndUserToMap('group-1', 'alice', 'teacher', 'teacher-1', 'user-1');
  assert.deepEqual(manager.getClientList({ groupId: 'group-1' }), ['teacher-1']);
});

test('getClientList returns teachers watching the same user', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'teacher', 'teacher-1', 'user-1');
  assert.deepEqual(manager.getClientList({ user: 'alice' }), ['teacher-1']);
  assert.deepEqual(manager.getClientList({ user: 'other' }), []);
});

test('getClientList ignores teachers watching unrelated studies', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'teacher', 'teacher-1', 'user-1');
  assert.deepEqual(manager.getClientList({ studyId: 'study-2' }), []);
});

test('getClientList targets students of the same study and user id', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'student', 'student-1', 'user-1');
  assert.deepEqual(manager.getClientList({ studyId: 'study-1', userId: 'user-1' }), ['student-1']);
  assert.deepEqual(manager.getClientList({ studyId: 'study-1', userId: 'user-9' }), []);
  assert.deepEqual(manager.getClientList({ studyId: 'study-2', userId: 'user-1' }), []);
});

test('getClientList targets students of the same study and username', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'student', 'student-1', 'user-1');
  assert.deepEqual(manager.getClientList({ studyId: 'study-1', username: 'alice' }), ['student-1']);
});

test('getClientList ignores clients without a known role', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'guest', 'guest-1', 'user-1');
  assert.deepEqual(manager.getClientList({ studyId: 'study-1' }), []);
});

test('getTimeSuperiorToXMinClientList selects only stale clients', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'teacher', 'fresh', 'user-1');
  manager.addActivityAndUserToMap('study-1', 'bob', 'teacher', 'stale', 'user-2');
  manager.clients.get('stale').lastTime = Date.now() - 6 * 60 * 1000;

  assert.deepEqual(manager.getTimeSuperiorToXMinClientList(5), ['stale']);
});

test('removeClient drops the entry', () => {
  manager.addActivityAndUserToMap('study-1', 'alice', 'teacher', 'client-1', 'user-1');
  manager.removeClient('client-1');
  assert.equal(manager.clients.has('client-1'), false);
});
