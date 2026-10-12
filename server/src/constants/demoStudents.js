'use strict';

/**
 * Fictional demo students used by the seeder and by the illustration generator
 * (`npm run art`). Kept in one place so the demo names, the seeded records and
 * the generated anime portraits always stay in sync.
 *
 * Shape: [name, department, headline, bio, teach[], learn[]]
 */
const studentProfiles = [
  ['Aarav Sharma', 'Computer Science', 'Frontend developer', 'I enjoy teaching React and building clean interfaces.', ['React', 'JavaScript', 'Git & GitHub'], ['Machine Learning', 'UI/UX Design']],
  ['Priya Patel', 'Information Technology', 'Database enthusiast', 'Happy to help with SQL, MongoDB and data modelling.', ['MongoDB', 'SQL', 'Data Analysis'], ['Deep Learning', 'English Speaking']],
  ['Rahul Verma', 'Computer Science', 'ML explorer', 'Focused on Machine Learning and Python. Ask me anything about pipelines.', ['Python', 'Machine Learning', 'Pandas & NumPy'], ['Flutter', 'Data Structures']],
  ['Sana Khan', 'Electronics', 'Robotics builder', 'Arduino, Raspberry Pi and basic circuits are my playground.', ['Arduino', 'Raspberry Pi', 'IoT Basics'], ['Video Editing', 'PCB Design']],
  ['Vikram Singh', 'Mathematics', 'Numbers nerd', 'Calculus and Linear Algebra explained simplesly.', ['Calculus', 'Linear Algebra', 'Discrete Mathematics'], ['Machine Learning', 'Statistics']],
  ['Ananya Iyer', 'Design', 'UI/UX designer', 'Figma, design systems and user flow thinking.', ['UI/UX Design', 'Figma', 'Graphic Design'], ['Prompt Engineering', 'Python']],
  ['Rohan Gupta', 'Mechanical', 'Practical maker', 'Photoshop, video editing and sketching for side projects.', ['Photoshop', 'Video Editing', 'Sketching'], ['Arduino', 'Photography']],
  ['Meera Nair', 'Management', 'Communication coach', 'Public speaking, English speaking and interview prep.', ['English Speaking', 'Public Speaking', 'Technical Writing'], ['Data Analysis', 'Git & GitHub']],
  ['Karan Mehta', 'Information Technology', 'Linux tinkerer', 'Networking, Linux and operating systems support.', ['Linux', 'Networking Basics', 'Operating Systems'], ['JavaScript', 'Chess']],
  ['Ishita Bansal', 'Computer Science', 'Backend builder', 'Node.js, Express and API design in my comfort zone.', ['Node.js', 'JavaScript', 'Java'], ['Machine Learning', 'Figma']],
  ['Aditya Rao', 'Electrical', 'Embedded dabbler', 'PCB design and circuit debugging skills.', ['PCB Design', 'Arduino', 'IoT Basics'], ['Python', 'UI/UX Design']],
  ['Sneha Joshi', 'Mathematics', 'Stats & Spanish', 'Statistics tutoring plus a little Spanish on the side.', ['Statistics', 'Physics', 'Spanish'], ['Machine Learning', 'Guitar']],
  ['Devansh Chawla', 'Computer Science', 'DSA coach', 'Data Structures, algorithms and interview prep.', ['Data Structures', 'Java', 'Git & GitHub'], ['Deep Learning', 'English Speaking']],
  ['Riya Agrawal', 'Design', 'Creative generalist', 'Photography, sketching and light video editing.', ['Photography', 'Sketching', 'Graphic Design'], ['React', 'Public Speaking']],
  ['Vivek Kapoor', 'Information Technology', 'Full-stack explorer', 'Flutter mobile apps and Python automation.', ['Flutter', 'Python', 'Git & GitHub'], ['Deep Learning', 'PCB Design']],
  ['Nisha Reddy', 'Electronics', 'IoT enthusiast', 'Sensors, Raspberry Pi and small smart projects.', ['Raspberry Pi', 'IoT Basics', 'Networking Basics'], ['Machine Learning', 'Figma']],
];

/** Map the tuple form into labelled objects for prompt building. */
const demoStudents = studentProfiles.map(([name, department, headline, bio, teach, learn], index) => ({
  index,
  name,
  department,
  headline,
  bio,
  teach,
  learn,
  year: [1, 2, 3, 4, 5][index % 5],
}));

module.exports = { studentProfiles, demoStudents };
