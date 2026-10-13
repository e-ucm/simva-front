require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const usertools = require('../routes/lib/usertools');

const SECRET = 'test-secret';

function sign(payload) {
  return jwt.sign(payload, SECRET);
}

function isAuthExpired(session) {
  return new Promise((resolve) => {
    usertools.isAuthExpired(session, (error, result) => resolve({ error, result }));
  });
}

test('preTabs walks up the requested number of levels', () => {
  assert.equal(usertools.preTabs(0), '/');
  assert.equal(usertools.preTabs(1), '/../');
  assert.equal(usertools.preTabs(3), '/../../../');
});

test('decodeJWT decodes a signed token', () => {
  const decoded = usertools.decodeJWT(sign({ foo: 'bar' }));
  assert.equal(decoded.foo, 'bar');
});

test('decodeJWT returns null for malformed tokens', () => {
  assert.equal(usertools.decodeJWT('not-a-token'), null);
});

test('getRoleFromJWT maps realm roles to app roles', () => {
  assert.equal(usertools.getRoleFromJWT({ realm_access: { roles: ['administrator'] } }), 'administrator');
  assert.equal(usertools.getRoleFromJWT({ realm_access: { roles: ['teacher'] } }), 'teacher');
  assert.equal(usertools.getRoleFromJWT({ realm_access: { roles: ['researcher'] } }), 'teacher');
  assert.equal(usertools.getRoleFromJWT({ realm_access: { roles: ['teaching-assistant'] } }), 'student');
  assert.equal(usertools.getRoleFromJWT({ realm_access: { roles: ['student'] } }), 'student');
  assert.equal(usertools.getRoleFromJWT({ realm_access: { roles: ['unknown'] } }), 'norole');
});

test('getProfileFromJWT extracts the profile fields', () => {
  const token = sign({
    iss: 'https://sso.test',
    preferred_username: 'alice',
    email: 'alice@test.com',
    realm_access: { roles: ['teacher'] }
  });

  const profile = usertools.getProfileFromJWT(token);
  assert.deepEqual(profile, {
    provider: 'https://sso.test',
    username: 'alice',
    email: 'alice@test.com',
    roles: ['teacher'],
    role: 'teacher'
  });
});

test('isAuthExpired treats missing sessions as expired', async () => {
  assert.deepEqual(await isAuthExpired(null), { error: null, result: { type: 'expired' } });
  assert.deepEqual(await isAuthExpired({}), { error: null, result: { type: 'expired' } });
  assert.deepEqual(await isAuthExpired({ user: {} }), { error: null, result: { type: 'expired' } });
});

test('isAuthExpired treats tokens without exp as expired', async () => {
  const session = { user: { jwt: sign({ foo: 'bar' }) } };
  const { result } = await isAuthExpired(session);
  assert.equal(result.type, 'expired');
});

test('isAuthExpired detects expired tokens', async () => {
  const session = { user: { jwt: sign({ exp: Math.floor(Date.now() / 1000) - 60 }) } };
  const { result } = await isAuthExpired(session);
  assert.equal(result.type, 'expired');
});

test('isAuthExpired accepts valid tokens', async () => {
  const session = { user: { jwt: sign({ exp: Math.floor(Date.now() / 1000) + 3600 }) } };
  const { result } = await isAuthExpired(session);
  assert.equal(result.type, 'ok');
});

test('generateUsername respects the requested length and alphabet', () => {
  const letters = usertools.generateUsername('letters', 12);
  assert.equal(letters.length, 12);
  assert.match(letters, /^[a-z]+$/);

  const alphanumeric = usertools.generateUsername('alphanumeric', 24);
  assert.equal(alphanumeric.length, 24);
  assert.match(alphanumeric, /^[a-z0-9]+$/);

  const base58 = usertools.generateUsername('base58', 24);
  assert.equal(base58.length, 24);
  assert.match(base58, /^[a-km-z1-9]+$/);

  const fallback = usertools.generateUsername('nope', 8);
  assert.match(fallback, /^[a-z]+$/);
});

test('randomString builds a string from the requested masks', () => {
  assert.equal(usertools.randomString(0, 'a'), '');
  assert.match(usertools.randomString(5, 'A'), /^[A-Z]{5}$/);
  assert.match(usertools.randomString(10, 'a#'), /^[a-z0-9]{10}$/);
});
