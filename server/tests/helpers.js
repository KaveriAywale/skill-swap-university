'use strict';

const mongoose = require('mongoose');
const { User, Skill, SkillOffer } = require('../src/models');
const { signAccessToken } = require('../src/utils/token');

let counter = 0;

/** Creates a persisted user with sensible defaults and returns the document. */
async function createUser(overrides = {}) {
  counter += 1;
  const { password: rawPassword, ...rest } = overrides;
  const password = await User.hashPassword(rawPassword || 'Password123');
  return User.create({
    name: `Test User ${counter}`,
    email: `test${counter}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@demo.ssu.edu`,
    department: 'Computer Science',
    year: 2,
    onboardingComplete: true,
    ...rest,
    password,
  });
}

/** Creates an active skill offer owned by `ownerId`. */
async function createOffer(ownerId, skillId, overrides = {}) {
  return SkillOffer.create({
    owner: ownerId,
    skill: skillId,
    title: 'Peer mentoring',
    description: 'I can help you get unstuck with the fundamentals.',
    level: 'Intermediate',
    format: 'both',
    availability: [{ day: 'Mon', from: '10:00', to: '12:00' }],
    status: 'active',
    ...overrides,
  });
}

/** Creates a skill document. */
async function createSkill(overrides = {}) {
  counter += 1;
  return Skill.create({
    name: `Test Skill ${counter}`,
    slug: `test-skill-${counter}-${Date.now()}`,
    category: 'programming',
    icon: 'Code2',
    ...overrides,
  });
}

function tokenFor(user) {
  return signAccessToken({ sub: user._id.toString() });
}

/** Returns a supertest request pre-set with the user's bearer token. */
function asUser(request, user) {
  return request.set('Authorization', `Bearer ${tokenFor(user)}`);
}

async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

module.exports = {
  createUser,
  createOffer,
  createSkill,
  tokenFor,
  asUser,
  clearDatabase,
};
