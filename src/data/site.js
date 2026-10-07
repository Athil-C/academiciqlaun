/**
 * Single source of truth for every number, contact and claim on the site.
 * Updated for AcademiQ — Connecting Minds. Creating Opportunities.
 */

export const brand = {
  name: 'AcademiQ',
  tagline: 'Connecting Minds. Creating Opportunities.',
  legal: 'AcademiQ Global Academic Ecosystem',
  program: 'AcademiQ Fellowship',
  url: 'https://academiq.org',
};

export const stats = {
  learners: 10000, // learners enrolled
  placed: 10000, // alias for learners to preserve compatibility with existing counters
  avgMonthly: 50000,
  avgLpa: 6.5,
  highestLpa: 45,
  lowestLpa: 4,
  alumniIncomeCr: 150.0,
  nonIt: 72, // % interdisciplinary learners
  it: 28, // % computational & technical
  companies: 120, // partner institutions
  institutions: 120,
  countries: 30, // countries reached
  initiatives: 75, // research initiatives
  years: 2,
  hubs: 6,
  domains: 6, // 6 Strategic Pillars
  modules: 24,
  months: 12,
  semesters: 2,
  upfrontPerSemester: 0,
  freeMaterialLakh: 10,
};

export const topics = [
  'Education',
  'Research',
  'Opportunities',
  'International Affairs',
  'Youth',
];

export const nav = [
  { label: 'Who We Are', href: '#who-we-are', note: 'An academic ecosystem' },
  { label: 'What We Do', href: '#what-we-do', note: 'Six strategic pillars' },
  { label: 'Our Reach', href: '#reach', note: 'A network in motion' },
  { label: 'Our Story', href: '#story', note: 'Knowledge & opportunity' },
  { label: 'Our Journey', href: '#journey', note: 'From an idea to an ecosystem' },
  { label: 'Founders', href: '#founders', note: 'The team behind the work' },
  { label: 'Opportunities', href: '#opportunities', note: 'Discover possibilities' },
  { label: 'Events', href: '#events', note: 'Ideas become conversations' },
];

export const footerNav = [
  { label: 'Who We Are', href: '#who-we-are' },
  { label: 'What We Do', href: '#what-we-do' },
  { label: 'Our Journey', href: '#journey' },
  { label: 'Founders', href: '#founders' },
  { label: 'Opportunities', href: '#opportunities' },
  { label: 'Events', href: '#events' },
  { label: 'Resources', href: '#resources' },
  { label: 'Join AcademiQ', href: '#apply' },
  { label: 'Contact', href: 'mailto:contact@academiq.org' },
];

export const footerConnect = [
  { label: 'Students', href: '#community' },
  { label: 'Researchers', href: '#community' },
  { label: 'Academics', href: '#community' },
  { label: 'Mentors', href: '#community' },
  { label: 'Institutions', href: '#collaborate' },
  { label: 'Partners', href: '#partners' },
];

export const contacts = {
  whatsapp: 'https://wa.me/',
  admissions: { label: 'Admissions & Join', phone: '+91 9876 543 210', tel: '+919876543210', email: 'join@academiq.org' },
  official: { label: 'Official queries', phone: '+91 9876 543 210', tel: '+919876543210', email: 'contact@academiq.org' },
  hr: { label: 'Academic Council', phone: '+91 9876 543 211', tel: '+919876543211', email: 'council@academiq.org' },
  feedback: { label: 'Feedback & queries', phone: '+91 9876 543 212', tel: '+919876543212', email: 'feedback@academiq.org' },
  placements: { label: 'Institutional partnerships', phone: '+91 9876 543 213', tel: '+919876543213', email: 'collaborate@academiq.org' },
  ceo: { label: 'Write to the founders', email: 'founders@academiq.org' },
};

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { label: 'Instagram', href: 'https://www.instagram.com' },
  { label: 'YouTube', href: 'https://www.youtube.com' },
];

export const external = {
  refer: '#',
  careers: '#',
  privacy: '#',
  terms: '#',
  alumni: '#',
  hiring: '#',
  tamil: '#',
};

export const hubs = [
  {
    city: 'New Delhi',
    tag: 'Academic Council',
    code: 'DEL',
    address: 'AcademiQ Research Council, New Delhi, India',
    lat: 28.6139,
    lon: 77.2090,
  },
  {
    city: 'wayand',
    tag: 'South Asia Chapter',
    code: 'COK',
    address: 'AcademiQ Innovation & Knowledge Center, wayand, Kerala',
    lat: 9.9312,
    lon: 76.2673,
  },
  {
    city: 'Bengaluru',
    tag: 'Research Pod',
    code: 'BLR',
    address: 'AcademiQ Tech Incubator, Bengaluru, Karnataka',
    lat: 12.9716,
    lon: 77.5946,
  },
  {
    city: 'London',
    tag: 'International Affairs',
    code: 'LON',
    address: 'AcademiQ Global Scholar Exchange, London, UK',
    lat: 51.5074,
    lon: -0.1278,
  },
  {
    city: 'Boston',
    tag: 'Fellowship Alliance',
    code: 'BOS',
    address: 'AcademiQ Fellowships Network, Boston, MA, USA',
    lat: 42.3601,
    lon: -71.0589,
  },
  {
    city: 'Singapore',
    tag: 'Asia-Pacific Cohort',
    code: 'SIN',
    address: 'AcademiQ Youth & Diplomacy Hub, Singapore',
    lat: 1.3521,
    lon: 103.8198,
  },
];

export const partners = ['Global Higher Ed Alliance', 'International Scholar Network', 'Open Academic Forum', 'Youth Diplomacy Council'];

export const award = {
  by: 'AcademiQ Global',
  title: 'Connecting Minds. Creating Opportunities.',
};

/** Indian digit grouping: 126000 -> 1,26,000 */
export const inr = (n) => new Intl.NumberFormat('en-IN').format(n);
