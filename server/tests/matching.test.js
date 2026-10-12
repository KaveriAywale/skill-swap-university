'use strict';

const request = require('supertest');
const app = require('../src/app');
const { createUser, createOffer, createSkill, asUser } = require('./helpers');
const { SkillOffer, User } = require('../src/models');

describe('Matching engine via GET /api/requests/:id/matches', () => {
  it('ranks a helper who offers the requested skill', async () => {
    const skill = await createSkill();
    const seeker = await createUser();
    const helper = await createUser({
      stats: { completedSessions: 10, ratingCount: 8, ratingSum: 38 },
    });
    await createOffer(helper._id, skill._id, {
      availability: [{ day: 'Mon', from: '10:00', to: '12:00' }],
    });

    const created = await asUser(request(app).post('/api/requests'), seeker).send({
      title: 'Need help with the fundamentals',
      description: 'Please walk me through the basics in a short session.',
      skill: skill._id.toString(),
      preferredSlots: [{ day: 'Mon', from: '10:00', to: '12:00' }],
    });
    expect(created.status).toBe(201);

    const res = await asUser(request(app).get(`/api/requests/${created.body.data.request._id}/matches`), seeker);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const top = res.body.data[0];
    expect(top.helper.id.toString()).toBe(helper._id.toString());
    expect(top.score).toBeGreaterThan(0);
    expect(top.reasons).toContain('Matches your requested skill');
    expect(top.canInvite).toBe(true);
  });

  it('grants a verified bonus that increases the match score', async () => {
    const skill = await createSkill();
    const seeker = await createUser();
    const helper = await createUser({ stats: { completedSessions: 5, ratingCount: 0, ratingSum: 0 } });
    await createOffer(helper._id, skill._id);

    const created = await asUser(request(app).post('/api/requests'), seeker).send({
      title: 'Basics please',
      description: 'Short intro session would be perfect for me.',
      skill: skill._id.toString(),
    });

    const before = await asUser(request(app).get(`/api/requests/${created.body.data.request._id}/matches`), seeker);
    const scoreBefore = before.body.data[0].score;

    await SkillOffer.updateOne({ owner: helper._id, skill: skill._id }, { verified: true });
    await User.updateOne(
      { _id: helper._id },
      { verifiedSkills: [{ skill: skill._id, score: 88 }] }
    );

    const after = await asUser(request(app).get(`/api/requests/${created.body.data.request._id}/matches`), seeker);
    expect(after.body.data[0].score).toBeGreaterThan(scoreBefore);
    expect(after.body.data[0].reasons).toContain('Assessment-verified skill');
  });

  it('does not match the seeker to themselves', async () => {
    const skill = await createSkill();
    const seeker = await createUser();
    await createOffer(seeker._id, skill._id);

    const created = await asUser(request(app).post('/api/requests'), seeker).send({
      title: 'Self match guard',
      description: 'This request has to be at least ten characters long.',
      skill: skill._id.toString(),
    });

    const res = await asUser(request(app).get(`/api/requests/${created.body.data.request._id}/matches`), seeker);
    expect(res.status).toBe(200);
    expect(res.body.data.every((m) => m.helper.id.toString() !== seeker._id.toString())).toBe(true);
  });
});