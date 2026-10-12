export const CATEGORY_META = {
  programming: { name: 'Programming & Web Development', icon: 'Code2', accent: 'lavender', color: '#4F46E5' },
  'ai-data': { name: 'AI & Data Science', icon: 'BrainCircuit', accent: 'cyan', color: '#0891B2' },
  mathematics: { name: 'Mathematics & Academics', icon: 'Sigma', accent: 'amber', color: '#D97706' },
  design: { name: 'Design & Creativity', icon: 'Palette', accent: 'pink', color: '#DB2777' },
  hardware: { name: 'Hardware & IT Support', icon: 'Cpu', accent: 'sky', color: '#0284C7' },
  robotics: { name: 'Robotics & Electronics', icon: 'Bot', accent: 'rose', color: '#E11D48' },
  languages: { name: 'Languages & Communication', icon: 'Languages', accent: 'emerald', color: '#059669' },
  arts: { name: 'Arts & Practical Skills', icon: 'Guitar', accent: 'lime', color: '#65A30D' },
};

export const URGENCY_META = {
  low: { label: 'Low', color: '#059669' },
  medium: { label: 'Medium', color: '#D97706' },
  high: { label: 'High', color: '#E11D48' },
  'exam-soon': { label: 'Exam soon', color: '#BE123C' },
};

export const REQUEST_STATUS = {
  open: { label: 'Open', color: '#6366F1' },
  matched: { label: 'Matched', color: '#4F46E5' },
  accepted: { label: 'Accepted', color: '#0891B2' },
  'in-progress': { label: 'In progress', color: '#D97706' },
  completed: { label: 'Completed', color: '#059669' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
};

export const SESSION_STATUS = {
  scheduled: { label: 'Scheduled', color: '#6366F1' },
  'in-progress': { label: 'In progress', color: '#D97706' },
  completed: { label: 'Completed', color: '#059669' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
};

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const YEARS = [1, 2, 3, 4, 5];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'Mathematics',
  'Physics',
  'Design',
  'Management',
  'Other',
];

export function timeAgo(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDate(dateInput) {
  if (!dateInput) return '';
  return new Date(dateInput).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}