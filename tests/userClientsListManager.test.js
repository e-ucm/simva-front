require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const manager = require('../routes/lib/userClientsListManager');

test.beforeEach(() => {
  manager.sessions.clear();
  manager.sessionClients.clear();
});

test('addUserSession stores and decodes the JWT', () => {
  const token = jwt.sign({ preferred_username: 'alice' }, 'secret');
  manager.addUserSession({ id: 'session-1', user: { jwt: token } });

  const stored = manager.sessions.get('session-1');
  assert.equal(stored.session.id, 'session-1');
  assert.equal(stored.jwtdecoded.preferred_username, 'alice');
});

test('addUserSession tolerates sessions without a JWT', () => {
  manager.addUserSession({ id: 'session-1', user: {} });
  assert.equal(manager.sessions.get('session-1').jwtdecoded, undefined);
});

test('getJWT returns the stored token or undefined', () => {
  const token = jwt.sign({ sub: '1' }, 'secret');
  manager.addUserSession({ id: 'session-1', user: { jwt: token } });

  assert.equal(manager.getJWT('session-1'), token);
  assert.equal(manager.getJWT('missing'), undefined);
});

test('getSession returns the session or a stub with the id', () => {
  const session = { id: 'session-1', user: {} };
  manager.addUserSession(session);
  assert.equal(manager.getSession('session-1'), session);
  assert.deepEqual(manager.getSession('missing'), { id: 'missing' });
});

test('refreshAuth replaces the token and decoded payload', () => {
  manager.addUserSession({ id: 'session-1', user: { jwt: jwt.sign({ sub: '1' }, 'secret') } });
  const refreshed = jwt.sign({ sub: '2', preferred_username: 'bob' }, 'secret');

  manager.refreshAuth('session-1', refreshed, 'refresh-token');

  assert.equal(manager.getJWT('session-1'), refreshed);
  assert.equal(manager.sessions.get('session-1').jwtdecoded.preferred_username, 'bob');
});

test('addClient and getRefreshClientList track clients per session', () => {
  manager.addClient('session-1', 'client-1');
  manager.addClient('session-1', 'client-2');

  assert.deepEqual(manager.getRefreshClientList(['session-1']), ['client-1', 'client-2']);
});

test('removeClient keeps the remaining clients and cleans up empty sessions', () => {
  manager.addClient('session-1', 'client-1');
  manager.addClient('session-1', 'client-2');

  manager.removeClient('session-1', 'client-1');
  assert.deepEqual(manager.getRefreshClientList(['session-1']), ['client-2']);

  manager.removeClient('session-1', 'client-2');
  assert.equal(manager.sessionClients.has('session-1'), false);
});

test('removeSession drops both the session and its clients', () => {
  manager.addUserSession({ id: 'session-1', user: {} });
  manager.addClient('session-1', 'client-1');

  manager.removeSession('session-1');

  assert.equal(manager.sessions.has('session-1'), false);
  assert.equal(manager.sessionClients.has('session-1'), false);
});
