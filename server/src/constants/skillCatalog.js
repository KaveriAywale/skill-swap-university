'use strict';

/**
 * Single source of truth for skill categories.
 * colour tokens are consumed by the frontend design system.
 */
const CATEGORIES = [
  {
    key: 'programming',
    name: 'Programming & Web Development',
    icon: 'Code2',
    color: '#7C5CFF',
    accent: 'lavender',
  },
  {
    key: 'ai-data',
    name: 'AI & Data Science',
    icon: 'BrainCircuit',
    color: '#22D3EE',
    accent: 'cyan',
  },
  {
    key: 'mathematics',
    name: 'Mathematics & Academics',
    icon: 'Sigma',
    color: '#F59E0B',
    accent: 'amber',
  },
  {
    key: 'design',
    name: 'Design & Creativity',
    icon: 'Palette',
    color: '#F472B6',
    accent: 'pink',
  },
  {
    key: 'hardware',
    name: 'Hardware & IT Support',
    icon: 'Cpu',
    color: '#38BDF8',
    accent: 'sky',
  },
  {
    key: 'robotics',
    name: 'Robotics & Electronics',
    icon: 'Bot',
    color: '#FB7185',
    accent: 'rose',
  },
  {
    key: 'languages',
    name: 'Languages & Communication',
    icon: 'Languages',
    color: '#34D399',
    accent: 'emerald',
  },
  {
    key: 'arts',
    name: 'Arts & Practical Skills',
    icon: 'Guitar',
    color: '#A3E635',
    accent: 'lime',
  },
];

/**
 * Seed catalogue of offered/learnable skills mapped to a category + icon.
 */
const SKILL_CATALOG = [
  { name: 'React', category: 'programming', icon: 'Atom' },
  { name: 'Node.js', category: 'programming', icon: 'Hexagon' },
  { name: 'JavaScript', category: 'programming', icon: 'Braces' },
  { name: 'Python', category: 'programming', icon: 'FileCode2' },
  { name: 'Java', category: 'programming', icon: 'Coffee' },
  { name: 'Data Structures', category: 'programming', icon: 'Binary' },
  { name: 'MongoDB', category: 'programming', icon: 'Leaf' },
  { name: 'Git & GitHub', category: 'programming', icon: 'GitBranch' },
  { name: 'Flutter', category: 'programming', icon: 'Smartphone' },
  { name: 'Machine Learning', category: 'ai-data', icon: 'BrainCircuit' },
  { name: 'Deep Learning', category: 'ai-data', icon: 'Network' },
  { name: 'Data Analysis', category: 'ai-data', icon: 'BarChart3' },
  { name: 'Pandas & NumPy', category: 'ai-data', icon: 'Table2' },
  { name: 'Prompt Engineering', category: 'ai-data', icon: 'Sparkles' },
  { name: 'SQL', category: 'ai-data', icon: 'Database' },
  { name: 'Calculus', category: 'mathematics', icon: 'Sigma' },
  { name: 'Linear Algebra', category: 'mathematics', icon: 'Grid2x2' },
  { name: 'Discrete Mathematics', category: 'mathematics', icon: 'Boxes' },
  { name: 'Statistics', category: 'mathematics', icon: 'TrendingUp' },
  { name: 'Physics', category: 'mathematics', icon: 'Atom' },
  { name: 'UI/UX Design', category: 'design', icon: 'PenTool' },
  { name: 'Figma', category: 'design', icon: 'Frame' },
  { name: 'Graphic Design', category: 'design', icon: 'Palette' },
  { name: 'Video Editing', category: 'design', icon: 'Clapperboard' },
  { name: 'Photoshop', category: 'design', icon: 'Image' },
  { name: 'Laptop Repair', category: 'hardware', icon: 'Wrench' },
  { name: 'Networking Basics', category: 'hardware', icon: 'Router' },
  { name: 'Operating Systems', category: 'hardware', icon: 'MonitorCog' },
  { name: 'Linux', category: 'hardware', icon: 'Terminal' },
  { name: 'Arduino', category: 'robotics', icon: 'CircuitBoard' },
  { name: 'Raspberry Pi', category: 'robotics', icon: 'Cpu' },
  { name: 'IoT Basics', category: 'robotics', icon: 'Radio' },
  { name: 'PCB Design', category: 'robotics', icon: 'CircuitBoard' },
  { name: 'English Speaking', category: 'languages', icon: 'MessageCircle' },
  { name: 'Technical Writing', category: 'languages', icon: 'PenLine' },
  { name: 'Public Speaking', category: 'languages', icon: 'Mic' },
  { name: 'Spanish', category: 'languages', icon: 'Languages' },
  { name: 'Guitar', category: 'arts', icon: 'Guitar' },
  { name: 'Photography', category: 'arts', icon: 'Camera' },
  { name: 'Chess', category: 'arts', icon: 'Crown' },
  { name: 'Cooking Basics', category: 'arts', icon: 'ChefHat' },
  { name: 'Sketching', category: 'arts', icon: 'Pencil' },
];

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

function categoryName(key) {
  const found = CATEGORIES.find((c) => c.key === key);
  return found ? found.name : key;
}

module.exports = { CATEGORIES, CATEGORY_KEYS, SKILL_CATALOG, categoryName };
