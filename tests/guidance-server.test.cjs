const assert = require('node:assert/strict');
const { test } = require('node:test');
async function serve(server, work) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { return await work(`http://127.0.0.1:${server.address().port}/guidance`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
test('custom guidance fails clearly without a server key', async () => {
  const { createGuidanceServer } = await import('../server/guidance.mjs');
  await serve(createGuidanceServer({ apiKey: '' }), async url => {
    const result = await fetch(url, { method: 'POST', body: JSON.stringify({ question: 'Money worries' }) });
    assert.equal(result.status, 503);
  });
});
test('server enforces origin, input and five-verse validation; model call is mocked', async () => {
  const { createGuidanceServer } = await import('../server/guidance.mjs');
  const verses = require('../data/verses.json');
  const cards = Object.keys(verses).slice(0, 5).map(verseId => ({ verseId, explanation: 'A contextual reflection', goal: 'One kind step' }));
  let calls = 0;
  const server = createGuidanceServer({ apiKey: 'test-only-key', fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.input[0].content, 'I keep comparing possessions.');
    assert.equal(body.text.format.schema.properties.cards.maxItems, 5);
    return { ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ cards }) }] }] }) };
  } });
  await serve(server, async url => {
    assert.equal((await fetch(url, { method: 'POST', headers: { Origin: 'https://untrusted.example' }, body: '{}' })).status, 403);
    assert.equal((await fetch(url, { method: 'POST', body: '{broken' })).status, 400);
    assert.equal((await fetch(url, { method: 'POST', body: JSON.stringify({ question: '' }) })).status, 400);
    const result = await fetch(url, { method: 'POST', body: JSON.stringify({ question: 'I keep comparing possessions.' }) });
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { cards });
    assert.equal(calls, 1);
  });
});
