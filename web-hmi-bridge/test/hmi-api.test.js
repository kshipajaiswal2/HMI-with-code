const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
  });
}

test('GET /api/hmi/overview returns platform status', async () => {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '5121' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await wait(1500);
    const response = await requestJson('http://127.0.0.1:5121/api/hmi/overview');
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.connected, true);
    assert.ok(Array.isArray(response.body.modules));
  } finally {
    child.kill('SIGTERM');
  }
});
