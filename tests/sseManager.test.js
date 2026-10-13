require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const manager = require('../routes/lib/sseManager');

function makeReq() {
  const handlers = {};
  return {
    query: {},
    on(event, handler) {
      handlers[event] = handler;
    },
    close() {
      handlers.close();
    }
  };
}

function makeRes() {
  return {
    headers: {},
    chunks: [],
    setHeader(name, value) {
      this.headers[name] = value;
    },
    write(chunk) {
      this.chunks.push(chunk);
    }
  };
}

test.beforeEach(() => {
  manager.clients.clear();
  manager.clientsOptions.clear();
});

test('generateClientId returns a non-empty string', () => {
  const id = manager.generateClientId();
  assert.equal(typeof id, 'string');
  assert.ok(id.length > 0);
});

test('addClient registers the client and sets SSE headers', () => {
  const req = makeReq();
  const res = makeRes();

  const clientId = manager.addClient(req, res);

  assert.equal(res.headers['Content-Type'], 'text/event-stream');
  assert.equal(res.headers['Cache-Control'], 'no-cache');
  assert.equal(res.headers.Connection, 'keep-alive');
  assert.equal(manager.getClientCount(), 1);
  assert.equal(manager.getClientConnected(clientId), true);
});

test('addClient removes the client on disconnect', () => {
  const req = makeReq();
  const res = makeRes();

  const clientId = manager.addClient(req, res);
  req.close();

  assert.equal(manager.getClientConnected(clientId), false);
  assert.equal(manager.getClientCount(), 0);
});

test('sendMessageToClient writes an SSE message with an event type', () => {
  const res = makeRes();
  manager.clients.set('client-1', res);

  manager.sendMessageToClient('client-1', { ok: true }, 'update');

  assert.deepEqual(res.chunks, ['event:update\ndata: {"ok":true}\n\n']);
});

test('sendMessageToClient writes an SSE message without an event type', () => {
  const res = makeRes();
  manager.clients.set('client-1', res);

  manager.sendMessageToClient('client-1', { ok: true });

  assert.deepEqual(res.chunks, ['data: {"ok":true}\n\n']);
});

test('sendMessageToClient ignores unknown clients', () => {
  assert.doesNotThrow(() => manager.sendMessageToClient('missing', { ok: true }, 'update'));
});

test('sendMessageToClientList writes to every client in the list', () => {
  const first = makeRes();
  const second = makeRes();
  manager.clients.set('client-1', first);
  manager.clients.set('client-2', second);

  manager.sendMessageToClientList(['client-1', 'client-2'], { n: 1 }, 'update');

  assert.deepEqual(first.chunks, ['event:update\ndata: {"n":1}\n\n']);
  assert.deepEqual(second.chunks, ['event:update\ndata: {"n":1}\n\n']);
});

test('broadcast writes to every connected client', () => {
  const first = makeRes();
  const second = makeRes();
  manager.clients.set('client-1', first);
  manager.clients.set('client-2', second);

  manager.broadcast({ hello: 'world' });

  assert.deepEqual(first.chunks, ['data: {"hello":"world"}\n\n']);
  assert.deepEqual(second.chunks, ['data: {"hello":"world"}\n\n']);
});
