'use strict';

const {
  Session,
  HelpRequest,
  Conversation,
  Message,
  User,
  Review,
  SkillOffer,
} = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPaginationMeta } = require('../utils/ApiResponse');
const { awardKarma, refreshBadges } = require('../services/karmaService');
const { createNotification } = require('../services/notificationService');

const KARMA = {
  teacher: 10,
  learner: 5,
  bonus: 2,
  firstSession: 5,
  reviewReceived: 3,
};

async function ensureConversation(userA, userB, { request, session, seed } = {}) {
  let conversation = await Conversation.findOne({
    participants: { $all: [userA, userB], $size: 2 },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userA, userB],
      request: request || undefined,
      session: session || undefined,
      lastMessage: seed || 'Conversation started',
    });
    if (seed) {
      await Message.create({
        conversation: conversation._id,
        sender: userA,
        body: seed,
        type: 'system',
      });
    }
  } else if (session && !conversation.session) {
    conversation.session = session;
    await conversation.save();
  }
  return conversation;
}

function assertParticipant(session, userId) {
  const isSeeker = session.seeker._id ? session.seeker._id.toString() === userId : session.seeker.toString() === userId;
  const isHelper = session.helper._id ? session.helper._id.toString() === userId : session.helper.toString() === userId;
  if (!isSeeker && !isHelper) throw ApiError.forbidden('You are not a participant in this session');
  return { isSeeker, isHelper };
}

/** Helper accepts an open request -> creates session + conversation. */
const acceptRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.requestId);
  if (!request) throw ApiError.notFound('Request not found');
  if (request.seeker.toString() === req.userId) throw ApiError.badRequest('You cannot help your own request');
  if (!['open', 'matched'].includes(request.status)) throw ApiError.badRequest('This request is no longer open');

  const { scheduledAt, format, meetingArea, durationMins } = req.body;
  if (!scheduledAt) throw ApiError.badRequest('scheduledAt is required');

  const offer = await SkillOffer.findOne({ owner: req.userId, skill: request.skill, status: 'active' });

  const session = await Session.create({
    request: request._id,
    offer: offer?._id,
    skill: request.skill,
    seeker: request.seeker,
    helper: req.userId,
    title: request.title,
    format: format || (request.format === 'either' ? 'online' : request.format),
    meetingArea: meetingArea || request.meetingArea || '',
    scheduledAt,
    durationMins: durationMins || 60,
    roomId: `ssu-${Math.random().toString(36).slice(2, 10)}`,
  });

  request.status = 'accepted';
  request.helper = req.userId;
  request.session = session._id;
  if (offer) request.matchedOffer = offer._id;
  await request.save();

  const conversation = await ensureConversation(request.seeker, req.userId, {
    request: request._id,
    session: session._id,
    seed: `Session scheduled: ${request.title}`,
  });

  await createNotification({
    userId: request.seeker,
    type: 'request-accepted',
    title: 'Your request was accepted',
    body: `${req.user.name} accepted "${request.title}".`,
    link: `/sessions/${session._id}`,
    meta: { sessionId: session._id.toString() },
  });

  const populated = await session.populate([
    { path: 'skill', select: 'name category icon' },
    { path: 'seeker', select: 'name avatar' },
    { path: 'helper', select: 'name avatar' },
  ]);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Request accepted. Session scheduled.',
    data: { session: populated, conversationId: conversation._id },
  });
});

const listSessions = asyncHandler(async (req, res) => {
  const { status, role, page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, parseInt(limit, 10) || 12);

  const base = role === 'helper' ? { helper: req.userId } : role === 'seeker' ? { seeker: req.userId } : { $or: [{ helper: req.userId }, { seeker: req.userId }] };
  const filter = status ? { ...base, status } : base;

  const [total, sessions] = await Promise.all([
    Session.countDocuments(filter),
    Session.find(filter)
      .populate('skill', 'name category icon')
      .populate('seeker', 'name avatar')
      .populate('helper', 'name avatar')
      .sort({ scheduledAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  return sendSuccess(res, {
    data: sessions,
    meta: buildPaginationMeta({ page: pageNum, limit: limitNum, total }),
  });
});

const getSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate('skill', 'name category icon')
    .populate('seeker', 'name avatar department year karma stats')
    .populate('helper', 'name avatar department year karma stats')
    .populate('request');
  if (!session) throw ApiError.notFound('Session not found');

  const { isSeeker, isHelper } = assertParticipant(session, req.userId);
  const confirmedByMe = (session.confirmedBy || []).some((u) => u.toString() === req.userId);
  const myReview = await Review.findOne({ session: session._id, author: req.userId });

  return sendSuccess(res, { data: { session, isSeeker, isHelper, confirmedByMe, myReview: Boolean(myReview) } });
});

const startSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw ApiError.notFound('Session not found');
  assertParticipant(session, req.userId);
  if (session.status !== 'scheduled') throw ApiError.badRequest('Session cannot be started');

  session.status = 'in-progress';
  await session.save();
  if (session.request) {
    await HelpRequest.updateOne({ _id: session.request }, { status: 'in-progress' });
  }
  return sendSuccess(res, { message: 'Session started', data: session });
});

const cancelSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw ApiError.notFound('Session not found');
  assertParticipant(session, req.userId);
  if (['completed', 'cancelled'].includes(session.status)) {
    throw ApiError.badRequest('Session already finished');
  }

  session.status = 'cancelled';
  session.cancelledBy = req.userId;
  session.cancelReason = req.body.reason || '';
  await session.save();
  if (session.request) await HelpRequest.updateOne({ _id: session.request }, { status: 'accepted' });

  const other = session.seeker.toString() === req.userId ? session.helper : session.seeker;
  await createNotification({
    userId: other,
    type: 'session-cancelled',
    title: 'A session was cancelled',
    body: `"${session.title}" was cancelled.`,
    link: `/sessions/${session._id}`,
  });

  return sendSuccess(res, { message: 'Session cancelled', data: session });
});

/**
 * Both participants must confirm completion. Karma is awarded exactly once via
 * an idempotent ledger write when the second confirmation arrives.
 */
const confirmCompletion = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw ApiError.notFound('Session not found');
  const { isSeeker } = assertParticipant(session, req.userId);
  if (session.status === 'cancelled') throw ApiError.badRequest('Session was cancelled');
  if (session.status === 'completed') {
    return sendSuccess(res, { message: 'Session already completed', data: { session, alreadyCompleted: true } });
  }

  if (!session.confirmedBy.some((u) => u.toString() === req.userId)) {
    session.confirmedBy.push(req.userId);
  }

  const bothConfirmed = session.confirmedBy.length >= 2;

  if (!bothConfirmed) {
    await session.save();
    const other = isSeeker ? session.helper : session.seeker;
    await createNotification({
      userId: other,
      type: 'session-completed',
      title: 'Confirm session completion',
      body: `Your partner marked "${session.title}" as complete. Please confirm.`,
      link: `/sessions/${session._id}`,
    });
    return sendSuccess(res, {
      message: 'Thanks! Waiting for your partner to confirm.',
      data: { session, bothConfirmed: false },
    });
  }

  // Both confirmed -> finalise.
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();

  if (session.request) await HelpRequest.updateOne({ _id: session.request }, { status: 'completed' });

  const [seeker, helper] = await Promise.all([
    User.findById(session.seeker),
    User.findById(session.helper),
  ]);

  // Prevent self-award: helper and seeker must differ.
  if (seeker && helper && seeker._id.toString() !== helper._id.toString()) {
    const refId = session._id.toString();
    await awardKarma({
      userId: helper._id,
      points: KARMA.teacher,
      reason: 'session-completed-teacher',
      refId,
      description: 'Taught a peer session',
    });
    await awardKarma({
      userId: seeker._id,
      points: KARMA.learner,
      reason: 'session-completed-learner',
      refId,
      description: 'Completed a learning session',
    });
    await awardKarma({
      userId: helper._id,
      points: KARMA.bonus,
      reason: 'session-completed-bonus',
      refId,
      description: 'Session completion bonus',
    });
    await awardKarma({
      userId: seeker._id,
      points: KARMA.bonus,
      reason: 'session-completed-bonus',
      refId,
      description: 'Session completion bonus',
    });

    // Update aggregate stats.
    const wasFirstForHelper = (helper.stats.completedSessions || 0) === 0;
    helper.stats.completedSessions += 1;
    helper.stats.taughtCount += 1;
    seeker.stats.completedSessions += 1;
    seeker.stats.learnedCount += 1;

    await helper.save();
    await seeker.save();

    if (wasFirstForHelper) {
      await awardKarma({
        userId: helper._id,
        points: KARMA.firstSession,
        reason: 'first-session-bonus',
        refId,
        description: 'First teaching session',
      });
    }

    if (session.offer) {
      await SkillOffer.updateOne({ _id: session.offer }, { $inc: { sessionCount: 1 } });
    }

    await refreshBadges(helper);
    await refreshBadges(seeker);

    await Promise.all([
      createNotification({
        userId: helper._id,
        type: 'session-completed',
        title: 'Session completed',
        body: `You earned ${KARMA.teacher + KARMA.bonus} karma for "${session.title}".`,
        link: `/sessions/${session._id}`,
      }),
      createNotification({
        userId: seeker._id,
        type: 'session-completed',
        title: 'Session completed',
        body: `You earned ${KARMA.learner + KARMA.bonus} karma for "${session.title}".`,
        link: `/sessions/${session._id}`,
      }),
    ]);
  }

  return sendSuccess(res, {
    message: 'Session completed. Karma awarded!',
    data: { session, bothConfirmed: true, karmaAwarded: true },
  });
});

/** Post-session review. One review per participant per session (enforced). */
const reviewSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw ApiError.notFound('Session not found');
  assertParticipant(session, req.userId);
  if (session.status !== 'completed') throw ApiError.badRequest('You can review after the session is completed');

  const { rating, comment } = req.body;
  const subject = session.seeker.toString() === req.userId ? session.helper : session.seeker;

  let review;
  try {
    review = await Review.create({
      session: session._id,
      author: req.userId,
      subject,
      rating,
      comment: comment || '',
    });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('You already reviewed this session');
    throw err;
  }

  const subjectUser = await User.findById(subject);
  subjectUser.stats.ratingCount += 1;
  subjectUser.stats.ratingSum += Number(rating);
  await subjectUser.save();

  await awardKarma({
    userId: subject,
    points: KARMA.reviewReceived,
    reason: 'review-received',
    refId: `${session._id}:${req.userId}`,
    description: 'Received a positive session review',
  });

  await refreshBadges(subjectUser);

  await createNotification({
    userId: subject,
    type: 'review',
    title: 'New review received',
    body: `You received ${rating}\u2605 for "${session.title}".`,
    link: `/profile`,
  });

  return sendSuccess(res, { statusCode: 201, message: 'Review submitted', data: review });
});

module.exports = {
  acceptRequest,
  listSessions,
  getSession,
  startSession,
  cancelSession,
  confirmCompletion,
  reviewSession,
};
