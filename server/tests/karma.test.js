'use strict';

const request = require('supertest');
const app = require('../src/app');
const { createUser, createOffer, createSkill, asUser } = require('./helpers');
const { Session, KarmaTransaction, User, HelpRequest } = require('../src/models');

describe('Session completion & karma', () => {
  async function setupScheduledSession() {
    const skill = await createSkill();
    const seeker = await createUser();
    const helper = await createUser();
    await createOffer(helper._id, skill._id);

    const created = await asUser(request(app).post('/api/requests'), seeker).send({
      title: 'Teach me the basics please',
      description: 'I would love a short introductory session this week.',
      skill: skill._id.toString(),
    });
    const requestId = created.body.data.request._id;

    const accepted = await asUser(request(app).post(`/api/sessions/${requestId}/accept`), helper).send({
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      format: 'online',
      durationMins: 60,
    });
    expect(accepted.status).toBe(201);
    return { seeker, helper, session: accepted.body.data.session, requestId };
  }

  it('creates a session when a helper accepts a request', async () => {
    const { session, requestId } = await setupScheduledSession();
    expect(session.status).toBe('scheduled');
    expect(session.roomId).toEqual(expect.any(String));

    const dbRequest = await HelpRequest.findById(requestId);
    expect(dbRequest.status).toBe('accepted');
    expect(dbRequest.helper.toString()).toBeTruthy();
  });

  it('awards karma exactly once after both participants confirm completion', async () => {
    const { seeker, helper, session } = await setupScheduledSession();
    const id = session._id;

    await asUser(request(app).post(`/api/sessions/${id}/start`), helper);

    const first = await asUser(request(app).post(`/api/sessions/${id}/complete`), helper);
    expect(first.status).toBe(200);
    expect(first.body.data.bothConfirmed).toBe(false);

    const second = await asUser(request(app).post(`/api/sessions/${id}/complete`), seeker);
    expect(second.status).toBe(200);
    expect(second.body.data.bothConfirmed).toBe(true);

    const updatedHelper = await User.findById(helper._id);
    const updatedSeeker = await User.findById(seeker._id);
    // teacher 10 + bonus 2 + first-session 5 = 17
    expect(updatedHelper.karma).toBe(17);
    // learner 5 + bonus 2 = 7
    expect(updatedSeeker.karma).toBe(7);

    const completed = await Session.findById(id);
    expect(completed.status).toBe('completed');
    expect(completed.confirmedBy.length).toBe(2);
  });

  it('is idempotent: repeated completion never double-awards', async () => {
    const { seeker, helper, session } = await setupScheduledSession();
    const id = session._id;

    await asUser(request(app).post(`/api/sessions/${id}/start`), helper);
    await asUser(request(app).post(`/api/sessions/${id}/complete`), helper);
    await asUser(request(app).post(`/api/sessions/${id}/complete`), seeker);
    await asUser(request(app).post(`/api/sessions/${id}/complete`), helper);
    await asUser(request(app).post(`/api/sessions/${id}/complete`), seeker);

    const teacherTx = await KarmaTransaction.countDocuments({
      user: helper._id,
      reason: 'session-completed-teacher',
      refId: id.toString(),
    });
    const learnerTx = await KarmaTransaction.countDocuments({
      user: seeker._id,
      reason: 'session-completed-learner',
      refId: id.toString(),
    });

    expect(teacherTx).toBe(1);
    expect(learnerTx).toBe(1);

    const updatedHelper = await User.findById(helper._id);
    expect(updatedHelper.karma).toBe(17);
  });
});