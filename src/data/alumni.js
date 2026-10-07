/**
 * AcademiQ Scholars, Fellows, Researchers and Institutions.
 */
export const alumni = [
  { name: 'Athil', stack: 'International Relations', track: 'Fellow', company: 'Global Affairs Cohort', lpa: 35, kind: 'current' },
  { name: 'Sarah Chen', stack: 'Computational Biology', track: 'Research', company: 'Cambridge Bio-Lab', lpa: 32, kind: 'placed' },
  { name: 'Dr. Arjun Menon', stack: 'Higher Education Policy', track: 'Mentor', company: 'Edinburgh Academic Circle', lpa: 30, kind: 'current' },
  { name: 'Priya Sharma', stack: 'Development Economics', track: 'Fellow', company: 'Oxford Policy Group', lpa: 28, kind: 'placed' },
  { name: 'Daniel Evans', stack: 'Machine Learning & Ethics', track: 'Research', company: 'Stanford AI Alliance', lpa: 26, kind: 'placed' },
  { name: 'Aysha K', stack: 'Climate Science', track: 'Research', company: 'IISc Research Pod', lpa: 22, kind: 'current' },
  { name: 'Farhan Malik', stack: 'Public Policy', track: 'Fellow', company: 'Harvard Scholar Network', lpa: 20, kind: 'placed' },
  { name: 'Dr. Maya Patel', stack: 'Academic Publishing', track: 'Mentor', company: 'Imperial College Cohort', lpa: 18, kind: 'current' },
  { name: 'Zainab Qureshi', stack: 'Quantitative Sociology', track: 'Research', company: 'LSE Global Pod', lpa: 18, kind: 'placed' },
  { name: 'Rohit Verma', stack: 'Applied Mathematics', track: 'Scholar', company: 'Max Planck Institute', lpa: 16, kind: 'current' },
  { name: 'Elena Rostova', stack: 'Youth Diplomacy', track: 'Fellow', company: 'Geneva Peace Forum', lpa: 15, kind: 'placed' },
  { name: 'Kabir Das', stack: 'Renewable Energy', track: 'Research', company: 'NUS Clean Tech', lpa: 15, kind: 'current' },
  { name: 'Ananya Roy', stack: 'Cognitive Science', track: 'Scholar', company: 'Toronto Brain Lab', lpa: 14, kind: 'current' },
  { name: 'Omar Al-Hassan', stack: 'Middle Eastern Studies', track: 'Fellow', company: 'Georgetown Council', lpa: 14, kind: 'placed' },
  { name: 'Shruti Nair', stack: 'Data & Public Health', track: 'Research', company: 'Johns Hopkins Alliance', lpa: 13, kind: 'current' },
  { name: 'Devanand K', stack: 'Agricultural Technology', track: 'Scholar', company: 'Wageningen Cohort', lpa: 12, kind: 'placed' },
];

export const qualifications = [
  'Undergraduate Students',
  'Young Researchers',
  'PhD Scholars',
  'Postdoctoral Fellows',
  'University Faculty',
  'Independent Scholars',
  'Youth Delegates',
  'Institutional Leaders',
];

export const placeNames = [
  'New Delhi',
  'wayand',
  'Bengaluru',
  'London',
  'Oxford',
  'Cambridge',
  'Boston',
  'Singapore',
  'Toronto',
  'Geneva',
  'Melbourne',
  'Tokyo',
];

export const initials = (name) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
};

export const stories = [
  { id: 'Suk8FX2OIhg', from: 'Regional College', to: 'International Fellow', title: 'Connecting regional talent with international research fellowships' },
  { id: 'yK7_jx_D_w8', from: 'Independent Student', to: 'Published Researcher', title: 'From initial question to peer-reviewed publication' },
  { id: 'mepWc1QBNO4', from: 'First-Gen Scholar', to: 'Fully-Funded PhD', title: 'Navigating graduate admissions and scholarship grants' },
  { id: 'y9FJpKGP9QY', from: 'Aspiring Researcher', to: 'Global Working Group', title: 'Collaborating across borders on high-impact research' },
];

export const explainers = [
  { id: '3YNspKWK_5A', title: 'What is AcademiQ?' },
  { id: '8BJJcAnSuRU', title: 'How AcademiQ works' },
];

export const origin = { name: 'wayand', lat: 9.97, lon: 76.28 };

export const destinations = [
  { name: 'Bengaluru', lat: 12.97, lon: 77.59, region: 'India' },
  { name: 'Chennai', lat: 13.08, lon: 80.27, region: 'India' },
  { name: 'Hyderabad', lat: 17.39, lon: 78.49, region: 'India' },
  { name: 'Mumbai', lat: 19.08, lon: 72.88, region: 'India' },
  { name: 'Delhi', lat: 28.61, lon: 77.21, region: 'India' },
  { name: 'Singapore', lat: 1.35, lon: 103.82, region: 'Asia Pacific' },
  { name: 'Melbourne', lat: -37.81, lon: 144.96, region: 'Asia Pacific' },
  { name: 'London', lat: 51.51, lon: -0.13, region: 'Europe' },
  { name: 'Oxford', lat: 51.75, lon: -1.25, region: 'Europe' },
  { name: 'Cambridge', lat: 52.20, lon: 0.12, region: 'Europe' },
  { name: 'Boston', lat: 42.36, lon: -71.05, region: 'Americas' },
  { name: 'Toronto', lat: 43.65, lon: -79.38, region: 'Americas' },
  { name: 'San Francisco', lat: 37.77, lon: -122.42, region: 'Americas' },
  { name: 'Geneva', lat: 46.20, lon: 6.14, region: 'Europe' },
];

export const regions = [
  {
    name: 'India',
    lon: 78,
    lat: 16,
    places: ['New Delhi', 'wayand', 'Bengaluru', 'Chennai', 'Hyderabad', 'Mumbai'],
  },
  {
    name: 'Europe',
    lon: 4,
    lat: 40,
    places: ['London', 'Oxford', 'Cambridge', 'Edinburgh', 'Geneva', 'Zurich'],
  },
  {
    name: 'Americas',
    lon: -100,
    lat: 30,
    places: ['Boston', 'New York', 'San Francisco', 'Toronto', 'Washington DC'],
  },
  {
    name: 'Asia Pacific',
    lon: 128,
    lat: -8,
    places: ['Singapore', 'Melbourne', 'Tokyo', 'Sydney'],
  },
];

export const labelled = ['London', 'Singapore', 'Melbourne', 'Boston', 'Toronto', 'Bengaluru', 'Delhi'];
