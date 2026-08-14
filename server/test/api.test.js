import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

export function startServer() {
  const db = createDb(':memory:');
  const app = createApp(db);
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        db,
        server,
        base: `http://127.0.0.1:${port}`,
        async close() {
          await new Promise((done) => server.close(done));
          db.close();
        },
      });
    });
  });
}

export function localDateOffset(daysFromNow = 30) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
}

let ctx;
beforeEach(async () => {
  ctx = await startServer();
});

afterEach(async () => {
  await ctx.close();
});

test('GET /api/slots returns 18 thirty-minute slots for a future date', async () => {
  const date = localDateOffset();
  const res = await fetch(`${ctx.base}/api/slots?date=${date}`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.date, date);
  assert.equal(body.slots.length, 18);
  assert.ok(body.slots.every((slot) => slot.status === 'available'));

  const first = body.slots[0];
  const start = new Date(first.start);
  const end = new Date(first.end);
  assert.equal(end.getTime() - start.getTime(), 30 * 60 * 1000);
  assert.equal(first.id, first.start);
});

test('GET /api/slots rejects an invalid date', async () => {
  for (const bad of ['not-a-date', '2026-02-30', '15-08-2026', undefined]) {
    const qs = bad === undefined ? '' : `?date=${encodeURIComponent(bad)}`;
    const res = await fetch(`${ctx.base}/api/slots${qs}`);
    assert.equal(res.status, 400, `expected 400 for date=${bad}`);
    const body = await res.json();
    assert.equal(typeof body.error, 'string');
  }
});

test('POST /api/bookings creates a booking and it appears in the list', async () => {
  const date = localDateOffset();
  const slots = (await (await fetch(`${ctx.base}/api/slots?date=${date}`)).json()).slots;
  const slot = slots[0];

  const res = await fetch(`${ctx.base}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId: slot.id, name: 'Ada Lovelace', email: 'ada@example.com' }),
  });
  assert.equal(res.status, 201);
  const booking = await res.json();
  assert.equal(booking.slotId, slot.id);
  assert.equal(booking.start, slot.id);
  assert.equal(booking.name, 'Ada Lovelace');
  assert.equal(booking.email, 'ada@example.com');
  assert.ok(booking.id);
  assert.ok(booking.createdAt);

  const list = await (await fetch(`${ctx.base}/api/bookings`)).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, booking.id);
  assert.equal(list[0].name, 'Ada Lovelace');

  const after = await (await fetch(`${ctx.base}/api/slots?date=${date}`)).json();
  assert.equal(after.slots.find((s) => s.id === slot.id).status, 'booked');
});

test('POST /api/bookings twice for the same slot returns 409', async () => {
  const date = localDateOffset();
  const slots = (await (await fetch(`${ctx.base}/api/slots?date=${date}`)).json()).slots;
  const slot = slots[0];

  const first = await fetch(`${ctx.base}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId: slot.id, name: 'Ada Lovelace' }),
  });
  assert.equal(first.status, 201);

  const second = await fetch(`${ctx.base}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId: slot.id, name: 'Grace Hopper' }),
  });
  assert.equal(second.status, 409);
  const body = await second.json();
  assert.equal(body.error, 'This time slot is already reserved.');

  const list = await (await fetch(`${ctx.base}/api/bookings`)).json();
  assert.equal(list.length, 1);
});

test('POST /api/bookings rejects invalid payloads with 400', async () => {
  const date = localDateOffset();
  const slots = (await (await fetch(`${ctx.base}/api/slots?date=${date}`)).json()).slots;
  const slot = slots[0];

  const cases = [
    {},
    { name: 'Ada' },
    { slotId: slot.id },
    { slotId: slot.id, name: '   ' },
    { slotId: slot.id, name: 'Ada', email: 'not-an-email' },
  ];

  for (const payload of cases) {
    const res = await fetch(`${ctx.base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(payload)}`);
  }
});

test('POST /api/bookings returns 404 for a well-formed slot outside the schedule', async () => {
  for (const slotId of ['2099-01-01T06:00:00.000Z', '2099-01-01T09:15:00.000Z', '2099-01-01T18:30:00.000Z']) {
    const res = await fetch(`${ctx.base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, name: 'Ada' }),
    });
    assert.equal(res.status, 404, `expected 404 for slotId=${slotId}`);
    const body = await res.json();
    assert.equal(typeof body.error, 'string');
  }
});

test('POST /api/bookings rejects a malformed JSON body with 400', async () => {
  const res = await fetch(`${ctx.base}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'Request body must be valid JSON.');
});

test('GET /api/bookings only lists upcoming meetings', async () => {
  const date = localDateOffset();
  const slots = (await (await fetch(`${ctx.base}/api/slots?date=${date}`)).json()).slots;

  for (let i = 0; i < 3; i += 1) {
    const res = await fetch(`${ctx.base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: slots[i].id, name: `Guest ${i}` }),
    });
    assert.equal(res.status, 201);
  }

  const list = await (await fetch(`${ctx.base}/api/bookings`)).json();
  assert.equal(list.length, 3);
  assert.deepEqual(
    list.map((b) => b.name),
    ['Guest 0', 'Guest 1', 'Guest 2'],
  );
});
