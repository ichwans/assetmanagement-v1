const { test } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('./app');

function createServer(overrides) {
  const app = createApp(overrides);
  const server = app.listen(0);
  const port = server.address().port;
  return { server, url: `http://127.0.0.1:${port}` };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

test('GET /health returns ok', async (t) => {
  const { server, url } = createServer();
  try {
    const res = await fetch(`${url}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body, { status: 'ok' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/evaluate returns 400 when function missing', async (t) => {
  const { server, url } = createServer();
  try {
    const res = await fetch(`${url}/api/evaluate`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ args: [] }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'function is required');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/evaluate returns contract result', async (t) => {
  const { server, url } = createServer({
    getContractForMSPAndCC: async () => ({
      evaluateTransaction: async () => Buffer.from(JSON.stringify({ assetId: 'A-001' }))
    }),
  });
  try {
    const res = await fetch(`${url}/api/evaluate`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ function: 'GetAsset', args: ['A-001'] }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.ok, true);
    assert.deepStrictEqual(body.result, { assetId: 'A-001' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/submit returns txId and committed true', async (t) => {
  const { server, url } = createServer({
    getContractForMSP: async () => ({
      createTransaction: () => ({
        getTransactionId: () => 'tx-123',
        submit: async () => Buffer.from(JSON.stringify({ status: 'ok' }))
      })
    }),
  });
  try {
    const res = await fetch(`${url}/api/submit`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ function: 'CreateAsset', args: ['A-001', 'CAT-01', 'UNIT-01', 'LOC-01'] }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.txId, 'tx-123');
    assert.strictEqual(body.committed, true);
    assert.deepStrictEqual(body.result, { status: 'ok' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
