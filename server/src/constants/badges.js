'use strict';

/**
 * Badge definitions. `threshold` is the karma/stat needed to unlock.
 * `metric` is the user statistic evaluated against the threshold.
 */
const BADGES = [
  {
    key: 'first-steps',
    name: 'First Steps',
    description: 'Completed your first peer session.',
    icon: 'Footprints',
    metric: 'completedSessions',
    threshold: 1,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    key: 'helpful-hand',
    name: 'Helpful Hand',
    description: 'Completed 5 peer sessions.',
    icon: 'HandHeart',
    metric: 'completedSessions',
    threshold: 5,
    tier: 'silver',
    color: '#C0C0C0',
  },
  {
    key: 'campus-mentor',
    name: 'Campus Mentor',
    description: 'Completed 15 peer sessions.',
    icon: 'GraduationCap',
    metric: 'completedSessions',
    threshold: 15,
    tier: 'gold',
    color: '#FFD700',
  },
  {
    key: 'knowledge-spark',
    name: 'Knowledge Spark',
    description: 'Earned 50 karma.',
    icon: 'Sparkles',
    metric: 'karma',
    threshold: 50,
    tier: 'bronze',
    color: '#FACC15',
  },
  {
    key: 'karma-flow',
    name: 'Karma Flow',
    description: 'Earned 150 karma.',
    icon: 'Flame',
    metric: 'karma',
    threshold: 150,
    tier: 'silver',
    color: '#38BDF8',
  },
  {
    key: 'campus-legend',
    name: 'Campus Legend',
    description: 'Earned 400 karma.',
    icon: 'Crown',
    metric: 'karma',
    threshold: 400,
    tier: 'gold',
    color: '#F59E0B',
  },
  {
    key: 'verified-mentor',
    name: 'Assessed Mentor',
    description: 'Passed an AI-assisted skill assessment.',
    icon: 'BadgeCheck',
    metric: 'verifiedSkills',
    threshold: 1,
    tier: 'silver',
    color: '#A78BFA',
  },
  {
    key: 'star-student',
    name: 'Star Student',
    description: 'Maintained an average rating of 4.5 or higher.',
    icon: 'Star',
    metric: 'rating',
    threshold: 4.5,
    tier: 'gold',
    color: '#FBBF24',
  },
  {
    key: 'community-pillar',
    name: 'Community Pillar',
    description: 'Taught across 3 different skills.',
    icon: 'Users',
    metric: 'distinctTaught',
    threshold: 3,
    tier: 'platinum',
    color: '#22D3EE',
  },
  {
    key: 'lifelong-learner',
    name: 'Lifelong Learner',
    description: 'Learned 3 different skills.',
    icon: 'BookOpenCheck',
    metric: 'distinctLearned',
    threshold: 3,
    tier: 'silver',
    color: '#34D399',
  },
];

const BADGE_KEYS = BADGES.map((b) => b.key);

function getBadge(key) {
  return BADGES.find((b) => b.key === key);
}

module.exports = { BADGES, BADGE_KEYS, getBadge };
