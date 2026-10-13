require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const utils = require('../routes/lib/utils');

const originals = {
  get: axios.get,
  post: axios.post,
  patch: axios.patch,
  put: axios.put,
  delete: axios.delete
};

test.afterEach(() => {
  Object.assign(axios, originals);
});

function run(invoke) {
  return new Promise((resolve, reject) => {
    invoke((error, data) => (error ? reject(error) : resolve(data)));
  });
}

test('get resolves the response data and sends both credentials as headers', async () => {
  let captured;
  axios.get = async (url, options) => {
    captured = { url, options };
    return { data: { ok: true } };
  };

  const data = await run((cb) => utils.get('http://api.test/resource', cb, 'the-jwt', 'the-key'));

  assert.deepEqual(data, { ok: true });
  assert.equal(captured.url, 'http://api.test/resource');
  assert.equal(captured.options.headers.Authorization, 'Bearer the-jwt');
  assert.equal(captured.options.headers['X-Api-Key'], 'the-key');
});

test('get omits credentials that are not provided', async () => {
  let captured;
  axios.get = async (url, options) => {
    captured = { url, options };
    return { data: {} };
  };

  await run((cb) => utils.get('http://api.test/resource', cb));

  assert.deepEqual(captured.options.headers, {});
});

test('get forwards axios errors to the callback', async () => {
  const boom = new Error('network down');
  axios.get = async () => {
    throw boom;
  };

  await assert.rejects(
    () => run((cb) => utils.get('http://api.test/resource', cb)),
    (error) => error.message === 'network down'
  );
});

test('post sends a JSON body by default', async () => {
  let captured;
  axios.post = async (url, body, options) => {
    captured = { url, body, options };
    return { data: { id: 1 } };
  };

  const data = await run((cb) => utils.post('http://api.test/resource', undefined, { name: 'alice' }, cb, 'the-jwt'));

  assert.deepEqual(data, { id: 1 });
  assert.deepEqual(captured.body, { name: 'alice' });
  assert.equal(captured.options.headers['Content-Type'], 'application/json');
  assert.equal(captured.options.headers.Authorization, 'Bearer the-jwt');
});

test('post forwards multipart requests untouched', async () => {
  let captured;
  axios.post = async (url, body, options) => {
    captured = { url, body, options };
    return { data: {} };
  };

  const req = { headers: { 'content-type': 'multipart/form-data; boundary=xyz' } };
  const formBody = { formData: { file: 'x' } };

  await run((cb) => utils.post('http://api.test/upload', req, formBody, cb));

  assert.equal(captured.body, req);
  assert.equal(captured.options.headers['Content-Type'], 'multipart/form-data');
  assert.equal(formBody.formData, undefined);
});

test('patch forwards multipart requests untouched', async () => {
  let captured;
  axios.patch = async (url, body, options) => {
    captured = { url, body, options };
    return { data: {} };
  };

  const req = { headers: {} };
  const formBody = { formData: { file: 'x' } };

  await run((cb) => utils.patch('http://api.test/upload', req, formBody, cb));

  assert.equal(captured.body, req);
  assert.equal(captured.options.headers['Content-Type'], 'multipart/form-data');
  assert.equal(formBody.formData, undefined);
});

test('put sends a JSON body by default', async () => {
  let captured;
  axios.put = async (url, body, options) => {
    captured = { url, body, options };
    return { data: {} };
  };

  await run((cb) => utils.put('http://api.test/resource', undefined, { name: 'bob' }, cb, 'the-jwt', 'the-key'));

  assert.deepEqual(captured.body, { name: 'bob' });
  assert.equal(captured.options.headers['Content-Type'], 'application/json');
  assert.equal(captured.options.headers['X-Api-Key'], 'the-key');
});

test('delete resolves the response data', async () => {
  let captured;
  axios.delete = async (url, options) => {
    captured = { url, options };
    return { data: { deleted: true } };
  };

  const data = await run((cb) => utils.delete('http://api.test/resource', cb, 'the-jwt'));

  assert.deepEqual(data, { deleted: true });
  assert.equal(captured.options.headers.Authorization, 'Bearer the-jwt');
});
