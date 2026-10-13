require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { createHMACKey, importKey, signMessage, verifyMessage } = require('../routes/lib/hMacKey/crypto');

test('signMessage and verifyMessage round-trip with the same key', async () => {
  const key = await importKey('shared-secret');

  const signature = await signMessage('hello world', key);

  assert.equal(typeof signature, 'string');
  assert.equal(await verifyMessage('hello world', signature, key), true);
  assert.equal(await verifyMessage('hello world!', signature, key), false);
});

test('verifyMessage rejects a signature from a different key', async () => {
  const signer = await importKey('first-secret');
  const verifier = await importKey('second-secret');

  const signature = await signMessage('hello world', signer);

  assert.equal(await verifyMessage('hello world', signature, verifier), false);
});

test('createHMACKey produces a usable, serializable key', async () => {
  const created = await createHMACKey();

  assert.ok(created.key);
  assert.ok(created.salt instanceof Uint8Array);
  assert.equal(typeof created.encodedKey, 'string');
  assert.equal(typeof created.encodedSalt, 'string');
  assert.ok(created.encodedKey.length > 0);
  assert.ok(created.encodedSalt.length > 0);

  const signature = await signMessage('payload', created.key);
  assert.equal(await verifyMessage('payload', signature, created.key), true);
});

test('createHMACKey rebuilds the same key from its encoded form', async () => {
  const created = await createHMACKey();

  const rebuilt = await createHMACKey(created.encodedPassword, {
    encodedKey: created.encodedKey,
    encodedSalt: created.encodedSalt
  });

  const signature = await signMessage('payload', rebuilt.key);
  assert.equal(await verifyMessage('payload', signature, created.key), true);
});
