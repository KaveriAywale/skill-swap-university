'use strict';

/**
 * Demo data seeder.
 * Usage: npm run seed  (or: node seeds/seed.js)
 *
 * Creates realistic fictional students, skills, offers, requests, sessions and
 * karma history so the application looks populated during demonstration.
 * All generated records are flagged `isDemo: true` and tagged in the UI.
 *
 * Runs against MONGODB_URI from server/.env.
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const {
  CATEGORIES,
  SKILL_CATALOG,
} = require('../src/constants/skillCatalog');
const { studentProfiles } = require('../src/constants/demoStudents');

const Skill = require('../src/models/Skill');
const Category = require('../src/models/Category');
const User = require('../src/models/User');
const SkillOffer = require('../src/models/SkillOffer');
const HelpRequest = require('../src/models/HelpRequest');
const Session = require('../src/models/Session');
const Review = require('../src/models/Review');
const KarmaTransaction = require('../src/models/KarmaTransaction');
const Notification = require('../src/models/Notification');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const SkillAssessment = require('../src/models/SkillAssessment');

const DEMO_PASSWORD = 'DemoPass123';
const CAMPUS = [77.1025, 28.7041]; // [lng, lat] base campus anchor (Delhi)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const YEARS = [1, 2, 3, 4, 5];

function jitter(base, spread) {
  return base + (Math.random() - 0.5) * spread;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randAvail() {
  const count = randInt(3, 5);
  const slots = [];
  const usedDays = new Set();
  let guard = 0;
  while (slots.length < count && guard < 40) {
    guard += 1;
    const day = pick(DAYS);
    if (usedDays.has(day)) continue;
    usedDays.add(day);
    slots.push({
      day,
      from: `${String(randInt(9, 13)).padStart(2, '0')}:00`,
      to: `${String(randInt(15, 20)).padStart(2, '0')}:00`,
    });
  }
  return slots;
}

async function resetDemoData() {
  const collections = [
    User, SkillOffer, HelpRequest, Session, Review,
    KarmaTransaction, Notification, Conversation, Message, SkillAssessment,
  ];
  for (const model of collections) {
    await model.deleteMany({ isDemo: true });
  }
  // Remove demo-only skills, keep any user-created skills.
  await Skill.deleteMany({ isDemo: true });
}

async function seedCatalog() {
  await Category.deleteMany({});
  await Category.insertMany(
    CATEGORIES.map((cat, i) => ({ ...cat, order: i }))
  );

  const existingSkills = await Skill.find().select('name slug');
  const byName = new Map(existingSkills.map((s) => [s.name, s._id]));
  const existingSlugs = new Set(existingSkills.map((s) => s.slug));

  const toCreate = [];
  for (const item of SKILL_CATALOG) {
    const slug = item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!existingSlugs.has(slug)) {
      toCreate.push({ ...item, slug, isDemo: true });
    }
  }
  const created = await Skill.insertMany(toCreate);
  created.forEach((s) => {
    byName.set(s.name, s._id);
    existingSlugs.add(s.slug);
  });
  return byName;
}

async function seedStudents(hash) {
  const users = [];
  studentProfiles.forEach(([name, department, headline, bio, teach, learn], index) => {
    users.push({
      _index: index,
      name,
      department,
      headline,
      bio,
      year: YEARS[index % YEARS.length],
      email: `demo${index + 1}@demo.ssu.edu`,
      studentId: `SSU${String(2023000 + index)}`,
      password: hash,
      availability: randAvail(),
      locationEnabled: true,
      locationLabel: index === 0 ? 'Main Library' : ['Academic Block', 'Library', 'Canteen', 'Sports Complex', 'CS Lab', 'Design Studio'][index % 6],
      campusLocation: {
        type: 'Point',
        coordinates: [CAMPUS[0] + jitter(0, 0.0008), CAMPUS[1] + jitter(0, 0.0009)],
      },
      commPrefs: {
        preferredMode: pick(['chat', 'video', 'in-person']),
        emailNotifications: true,
        discoverable: true,
      },
      karma: randInt(20, 320),
      stats: {
        completedSessions: randInt(1, 28),
        taughtCount: randInt(1, 18),
        learnedCount: randInt(0, 12),
        ratingCount: randInt(0, 16),
        ratingSum: 0,
      },
      isDemo: true,
      onboardingComplete: true,
      _teach: teach,
      _learn: learn,
    });
  });

  users.forEach((u) => {
    u.stats.ratingSum = Math.round(u.stats.ratingCount * jitter(4.1, 0.7) * 10) / 10;
  });

  const docs = await User.insertMany(users);
  return docs.map((doc, i) => ({ ...users[i], doc }));
}

async function attachSkillInterest(records, skillMap) {
  for (const rec of records) {
    const teachIds = rec._teach.map((n) => skillMap.get(n)).filter(Boolean);
    const learnIds = rec._learn.map((n) => skillMap.get(n)).filter(Boolean);

    await User.updateOne({ _id: rec.doc._id }, { skillsWanted: learnIds });

    const offers = teachIds.map((skillId) => ({
      owner: rec.doc._id,
      skill: skillId,
      title: `${rec._teach[rec._teach.findIndex((n) => skillMap.get(n) === skillId)]} mentoring`,
      description: `${rec.headline}. I can help beginners get unstuck and build real skills.`,
      level: pick(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
      format: pick(['in-person', 'online', 'both']),
      availability: rec.availability,
      verified: Math.random() > 0.55,
      verificationScore: randInt(72, 96),
      status: 'active',
      isDemo: true,
      sessionCount: randInt(0, 12),
    }));
    if (offers.length && Math.random() > 0.8) offers[offers.length - 1].status = 'paused';
    rec._offers = await SkillOffer.insertMany(offers);
  }

  for (const rec of records) {
    const verified = (rec._offers || [])
      .filter((o) => o.verified)
      .map((o) => ({ skill: o.skill, score: o.verificationScore, assessedAt: new Date() }));
    if (verified.length) {
      await User.updateOne({ _id: rec.doc._id }, { verifiedSkills: verified });
    }
  }
}

async function seedBadgesAndFeed(records) {
  for (const rec of records) {
    const user = await User.findById(rec.doc._id);
    const badges = [];
    if (user.stats.completedSessions >= 1) badges.push({ key: 'first-steps', earnedAt: subDays(30) });
    if (user.stats.completedSessions >= 5) badges.push({ key: 'helpful-hand', earnedAt: subDays(20) });
    if (user.karma >= 50) badges.push({ key: 'knowledge-spark', earnedAt: subDays(12) });
    if (user.karma >= 150) badges.push({ key: 'karma-flow', earnedAt: subDays(5) });
    if (user.stats.ratingCount >= 4) {
      const avg = user.stats.ratingSum / user.stats.ratingCount;
      if (avg >= 4.5) badges.push({ key: 'star-student', earnedAt: subDays(3) });
    }
    if ((user.verifiedSkills || []).length >= 1) badges.push({ key: 'verified-mentor', earnedAt: subDays(8) });
    user.badges = badges;
    await user.save();
  }
}

function subDays(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function seedRequestsAndSessions(records, skillMap) {
  const requests = [];

  // A few open requests spread across students.
  const requestSeeds = [
    ['Help with React hooks', 'React', 'computer', 'high'],
    ['Prepare for Machine Learning exam', 'Machine Learning', 'ai-data', 'exam-soon'],
    ['Need Guitar basics', 'Guitar', 'arts', 'low'],
    ['MongoDB aggregation pipeline help', 'MongoDB', 'ai-data', 'medium'],
    ['DSA recursion practice', 'Data Structures', 'computer', 'medium'],
    ['Figma portfolio review', 'Figma', 'design', 'low'],
    ['English speaking practice partner', 'English Speaking', 'languages', 'low'],
    ['Calculus integration doubts', 'Calculus', 'math', 'medium'],
  ];

  for (let i = 0; i < requestSeeds.length; i += 1) {
    const [title, skillName, category, urgency] = requestSeeds[i];
    const sk = skillMap.get(skillName);
    if (!sk) continue;
    const seeker = records[i % records.length];
    requests.push({
      seeker: seeker.doc._id,
      title,
      description: `I'm looking for a peer who can${' '}${title.toLowerCase().replace(/^help with /, 'help me with ')}. Short 30-60 minute sessions are perfect.`,
      category: category === 'computer' ? 'programming' : category === 'math' ? 'mathematics' : category,
      skill: sk,
      urgency,
      format: i % 2 === 0 ? 'either' : 'online',
      preferredSlots: seeker._offers[0]?.availability?.slice(0, 2) || [],
      meetingArea: i % 3 === 0 ? 'Main Library' : '',
      status: 'open',
      isDemo: true,
    });
  }
  const formedRequests = await HelpRequest.insertMany(requests);

  // One or two completed sessions with reviews + karma for the activity feed.
  const reviewTexts = [
    'Great at explaining tricky concepts, highly recommended.',
    'Patient and very clear. My doubts were sorted quickly.',
    'Super helpful session, came fully prepared.',
  ];

  for (let i = 0; i < 4; i += 1) {
    const helper = records[randInt(0, records.length - 1)];
    const seeker = records[randInt(0, records.length - 1)];
    if (helper.doc._id.toString() === seeker.doc._id.toString()) continue;
    const skill = helper._offers?.[0]?.skill;
    if (!skill) continue;
    const created = subDays(randInt(1, 20));
    const scheduled = new Date(created.getTime() + 86400000);

    const session = await Session.create({
      skill,
      seeker: seeker.doc._id,
      helper: helper.doc._id,
      title: `${helper._offers[0].title} session`,
      format: i % 2 === 0 ? 'online' : 'in-person',
      meetingArea: 'Main Library',
      scheduledAt: scheduled,
      status: 'completed',
      confirmedBy: [helper.doc._id, seeker.doc._id],
      completedAt: new Date(scheduled.getTime() + 3600000),
      roomId: `demo-${Math.random().toString(36).slice(2, 10)}`,
      isDemo: true,
      createdAt: created,
    });

    await Session.updateOne({ _id: session._id }, { $set: { createdAt: created } });
    await Review.insertMany([
      {
        session: session._id,
        author: seeker.doc._id,
        subject: helper.doc._id,
        rating: randInt(4, 5),
        comment: pick(reviewTexts),
        isDemo: true,
      },
      {
        session: session._id,
        author: helper.doc._id,
        subject: seeker.doc._id,
        rating: randInt(3, 5),
        comment: 'Good student, came prepared.',
        isDemo: true,
      },
    ]);

    for (const [{ userId, reason, points }, label] of [
      [{ userId: helper.doc._id, reason: 'session-completed-teacher', points: 10 }, 'Taught a peer session'],
      [{ userId: seeker.doc._id, reason: 'session-completed-learner', points: 5 }, 'Completed a learning session'],
      [{ userId: helper.doc._id, reason: 'session-completed-bonus', points: 2 }, 'Session completion bonus'],
      [{ userId: seeker.doc._id, reason: 'session-completed-bonus', points: 2 }, 'Session completion bonus'],
      [{ userId: helper.doc._id, reason: 'review-received', points: 3 }, 'Received a positive session review'],
    ]) {
      try {
        await KarmaTransaction.create({
          user: userId,
          points,
          reason,
          refId: `${session._id}:${reason}`,
          description: label,
          balanceAfter: 0,
          createdAt: created,
          isDemo: true,
        });
      } catch {
        /* skip duplicates */
      }
    }
  }

  // A conversation between two students.
  const a = records[0].doc;
  const b = records[1].doc;
  const conv = await Conversation.create({
    participants: [a._id, b._id],
    lastMessage: 'Sure, let me know when works for you!',
    lastMessageAt: subDays(2),
    isDemo: true,
  });
  await Message.create([
    {
      conversation: conv._id,
      sender: a._id,
      body: 'Hey, I saw you teach React. Available Thursday evening?',
      isDemo: true,
      createdAt: subDays(3),
    },
    {
      conversation: conv._id,
      sender: b._id,
      body: 'Yes, Thursday at 6 works. Want it online?',
      isDemo: true,
      createdAt: subDays(2),
    },
    {
      conversation: conv._id,
      sender: a._id,
      body: 'Sure, let me know when works for you!',
      isDemo: true,
      createdAt: subDays(2),
    },
  ]);

  return { requests: formedRequests, sessionsCount: 4 };
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skill_swap_university';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  // eslint-disable-next-line no-console
  console.log('[seed] connected to', uri);

  await resetDemoData();
  const skillMap = await seedCatalog();
  const hash = await User.hashPassword(DEMO_PASSWORD);
  const records = await seedStudents(hash);
  await attachSkillInterest(records, skillMap);
  await seedBadgesAndFeed(records);
  const feed = await seedRequestsAndSessions(records, skillMap);

  // Recompute correct karma balances from the ledger.
  for (const rec of records) {
    const agg = await KarmaTransaction.aggregate([
      { $match: { user: rec.doc._id } },
      { $group: { _id: null, sum: { $sum: '$points' } } },
    ]);
    const earned = agg[0]?.sum || 0;
    await User.updateOne({ _id: rec.doc._id }, { karma: rec.doc.karma + earned });
  }

  await Notification.deleteMany({});
  // eslint-disable-next-line no-console
  console.log('[seed] done.');
  // eslint-disable-next-line no-console
  console.log(`  Skills: ${skillMap.size}, Students: ${records.length}, Open requests: ${feed.requests.length}`);
  // eslint-disable-next-line no-console
  console.log(`  Demo login: demo1@demo.ssu.edu / ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exit(1);
});