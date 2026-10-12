'use strict';

const request = require('supertest');
const app = require('../src/app');
const { createUser, tokenFor } = require('./helpers');

describe('Authentication', () => {
  const baseEmail = `newbie.${Date.now()}@demo.ssu.edu`;

  describe('POST /api/auth/register', () => {
    it('creates an account and returns a token + user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New Student', email: baseEmail, password: 'Password123', department: 'Design', year: 1 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe(baseEmail);
      expect(res.body.data.user.onboardingComplete).toBe(false);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('rejects a duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Copy Cat', email: baseEmail, password: 'Password123' });
      expect(res.status).toBe(409);
    });

    it('rejects an invalid email with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bad Email', email: 'not-an-email', password: 'Password123' });
      expect(res.status).toBe(400);
    });

    it('rejects a short password with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Short Pass', email: `short.${Date.now()}@demo.ssu.edu`, password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid credentials', async () => {
      const user = await createUser({ email: `login.${Date.now()}@demo.ssu.edu`, password: 'Password123' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user.id || res.body.data.user._id).toBeTruthy();
    });

    it('rejects a wrong password with 401', async () => {
      const user = await createUser({ email: `wrong.${Date.now()}@demo.ssu.edu`, password: 'Password123' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'NopeNopeNope' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/avatar', () => {
    it('requires authentication (registration uploads after the account exists)', async () => {
      const res = await request(app)
        .post('/api/auth/avatar')
        .attach('image', Buffer.from('not-a-real-image'), 'avatar.png');
      expect(res.status).toBe(401);
    });

    it('rejects an unauthenticated request even before parsing the file', async () => {
      const res = await request(app).post('/api/auth/avatar');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {    it('requires authentication', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns the current user with a valid token', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.email);
    });
  });

  describe('PATCH /api/auth/profile', () => {
    it('updates allowed profile fields', async () => {
      const user = await createUser();
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ name: 'Renamed Student', headline: 'Loves testing', department: 'Mathematics' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Renamed Student');
      expect(res.body.data.headline).toBe('Loves testing');
    });

    it('rejects an invalid department with 400', async () => {
      const user = await createUser();
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ department: 'Underwater Basket Weaving' });
      expect(res.status).toBe(400);
    });
  });
});