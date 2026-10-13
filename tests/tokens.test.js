require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateUrl, createUrl } = require('../routes/lib/hMacKey/tokens');
const { importKey } = require('../routes/lib/hMacKey/crypto');

function queryOf(url) {
  const query = {};
  for (const [key, value] of new URL(url).searchParams) {
    query[key] = value;
  }
  return query;
}

test('createUrl signs a URL that validateUrl accepts', async () => {
  const key = await importKey('signing-secret');
  const base = 'https://simva.test/simlets/1';

  const { data } = await createUrl(base, { user: 'alice', session: 's1' }, key);
  const query = queryOf(data.url);

  assert.ok(query.signature);
  assert.ok(query.ts);
  assert.equal(await validateUrl(base, query, key), true);
});

test('validateUrl rejects a tampered parameter', async () => {
  const key = await importKey('signing-secret');
  const base = 'https://simva.test/simlets/1';

  const { data } = await createUrl(base, { user: 'alice' }, key);
  const query = queryOf(data.url);
  query.user = 'mallory';

  assert.equal(await validateUrl(base, query, key), false);
});

test('validateUrl rejects a missing signature', async () => {
  const key = await importKey('signing-secret');
  const base = 'https://simva.test/simlets/1';

  assert.equal(await validateUrl(base, { user: 'alice' }, key), false);
});

test('validateUrl rejects a signature from another key', async () => {
  const signer = await importKey('signing-secret');
  const verifier = await importKey('other-secret');
  const base = 'https://simva.test/simlets/1';

  const { data } = await createUrl(base, { user: 'alice' }, signer);
  const query = queryOf(data.url);

  assert.equal(await validateUrl(base, query, verifier), false);
});
