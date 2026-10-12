'use strict';

const request = require('supertest');
const app = require('../src/app');
const { createUser, asUser } = require('./helpers');

describe('Conversations & messaging authorization', () => {
  it('creates a conversation between two users', async () => {
    const a = await createUser();
    const b = await createUser();

    const res = await asUser(request(app).post('/api/conversations'), a).send({ userId: b._id.toString() });
    expect(res.status).toBe(201);
    expect(res.body.data.participants.length).toBe(2);
  });

  it('rejects messaging yourself', async () => {
    const a = await createUser();
    const res = await asUser(request(app).post('/api/conversations'), a).send({ userId: a._id.toString() });
    expect(res.status).toBe(400);
  });

  it('lets a participant read and send messages', async () => {
    const a = await createUser();
    const b = await createUser();
    const conv = await asUser(request(app).post('/api/conversations'), a).send({ userId: b._id.toString() });
    const convId = conv.body.data._id;

    const send = await asUser(request(app).post(`/api/conversations/${convId}/messages`), a).send({ body: 'Hello there!' });
    expect(send.status).toBe(201);

    const read = await asUser(request(app).get(`/api/conversations/${convId}/messages`), b);
    expect(read.status).toBe(200);
    expect(read.body.data[0].body).toBe('Hello there!');
  });

  it('forbids a non-participant from reading or writing', async () => {
    const a = await createUser();
    const b = await createUser();
    const outsider = await createUser();
    const conv = await asUser(request(app).post('/api/conversations'), a).send({ userId: b._id.toString() });
    const convId = conv.body.data._id;

    const read = await asUser(request(app).get(`/api/conversations/${convId}/messages`), outsider);
    expect(read.status).toBe(403);

    const write = await asUser(request(app).post(`/api/conversations/${convId}/messages`), outsider).send({ body: 'intruder' });
    expect(write.status).toBe(403);
  });

  it('rejects an empty message body', async () => {
    const a = await createUser();
    const b = await createUser();
    const conv = await asUser(request(app).post('/api/conversations'), a).send({ userId: b._id.toString() });
    const convId = conv.body.data._id;

    const res = await asUser(request(app).post(`/api/conversations/${convId}/messages`), a).send({ body: '   ' });
    expect(res.status).toBe(400);
  });
});