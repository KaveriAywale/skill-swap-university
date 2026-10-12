export const CATEGORY_META = {
  programming: { name: 'Programming & Web Development', icon: 'Code2', accent: 'lavender', color: '#7C5CFF' },
  'ai-data': { name: 'AI & Data Science', icon: 'BrainCircuit', accent: 'cyan', color: '#22D3EE' },
  mathematics: { name: 'Mathematics & Academics', icon: 'Sigma', accent: 'amber', color: '#F59E0B' },
  design: { name: 'Design & Creativity', icon: 'Palette', accent: 'pink', color: '#F472B6' },
  hardware: { name: 'Hardware & IT Support', icon: 'Cpu', accent: 'sky', color: '#38BDF8' },
  robotics: { name: 'Robotics & Electronics', icon: 'Bot', accent: 'rose', color: '#FB7185' },
  languages: { name: 'Languages & Communication', icon: 'Languages', accent: 'emerald', color: '#34D399' },
  arts: { name: 'Arts & Practical Skills', icon: 'Guitar', accent: 'lime', color: '#A3E635' },
};

export const URGENCY_META = {
  low: { label: 'Low', color: '#34D399' },
  medium: { label: 'Medium', color: '#F5B62D' },
  high: { label: 'High', color: '#FB7185' },
  'exam-soon': { label: 'Exam soon', color: '#F43F5E' },
};

export const REQUEST_STATUS = {
  open: { label: 'Open', color: '#A78BFA' },
  matched: { label: 'Matched', color: '#7C5CFF' },
  accepted: { label: 'Accepted', color: '#22D3EE' },
  'in-progress': { label: 'In progress', color: '#F5B62D' },
  completed: { label: 'Completed', color: '#34D399' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
};

export const SESSION_STATUS = {
  scheduled: { label: 'Scheduled', color: '#A78BFA' },
  'in-progress': { label: 'In progress', color: '#F5B62D' },
  completed: { label: 'Completed', color: '#34D399' },
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