require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobquest-ai';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Clear existing seed collections
  await db.collection('users').deleteMany({ email: /@seed\.local$/ });
  await db.collection('jobs').deleteMany({ source: 'seed' });
  await db.collection('applications').deleteMany({ applicationMethod: 'seed' });

  const password = 'password123';
  const hashed = await bcrypt.hash(password, 12);

  const userDoc = {
    email: 'demo@seed.local',
    password: hashed,
    name: 'Demo User',
    role: 'user',
    isEmailVerified: true,
    isOnboarded: true,
    profile: {
      firstName: 'Demo',
      lastName: 'User',
      title: 'Software Engineer',
      location: 'Remote',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
      experience: 3,
    },
    preferences: {
      jobTypes: ['full-time', 'remote'],
      locations: ['Remote', 'Bangalore'],
      salaryRange: { min: 800000, max: 1800000, currency: 'INR' },
      remoteWork: true,
      targetCompanies: ['Google', 'Meta', 'Stripe'],
      notifications: { email: true, push: true, jobAlerts: true, applicationUpdates: true },
    },
    aiConfig: { provider: 'lm-studio', model: 'local-model', enabled: true, apiUrl: 'http://localhost:1234' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const userRes = await db.collection('users').insertOne(userDoc);
  const userId = userRes.insertedId;
  console.log('Created user:', userDoc.email);

  const jobs = [
    { title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', salary: '₹18-24 LPA', skills: ['React', 'TypeScript'] },
    { title: 'Full Stack Developer', company: 'Razorpay', location: 'Bangalore', salary: '₹12-18 LPA', skills: ['Node.js', 'React'] },
    { title: 'Software Engineer II', company: 'Google', location: 'Hyderabad', salary: '₹25-35 LPA', skills: ['C++', 'Python'] },
    { title: 'React Developer', company: 'Flipkart', location: 'Bangalore', salary: '₹10-14 LPA', skills: ['React', 'Redux'] },
    { title: 'Backend Engineer', company: 'Swiggy', location: 'Remote', salary: '₹14-20 LPA', skills: ['Node.js', 'MongoDB'] },
  ];

  const jobDocs = jobs.map((j, i) => ({
    jobId: `seed-${i + 1}`,
    title: j.title,
    company: j.company,
    location: j.location,
    description: `Seed job: ${j.title} at ${j.company}.`,
    salary: j.salary,
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: j.skills,
    source: 'seed',
    url: `https://example.com/jobs/seed-${i + 1}`,
    applyUrl: `https://example.com/jobs/seed-${i + 1}/apply`,
    datePosted: new Date(),
    userId,
    status: 'saved',
    isActive: true,
    aiScore: 70 + i * 5,
    matchingSkills: j.skills,
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const jobRes = await db.collection('jobs').insertMany(jobDocs);
  const jobIds = Object.values(jobRes.insertedIds);
  console.log('Created jobs:', jobIds.length);

  const statuses = ['applied', 'under_review', 'interviewing', 'offer_received'];
  const appDocs = jobIds.slice(0, 4).map((jid, i) => ({
    userId,
    jobId: jid,
    applicationId: `APP-SEED-${i + 1}`,
    status: statuses[i],
    appliedDate: new Date(Date.now() - (i + 1) * 86400000),
    lastStatusUpdate: new Date(),
    applicationMethod: 'seed',
    platform: 'other',
    notes: 'Seed application',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.collection('applications').insertMany(appDocs);
  console.log('Created applications:', appDocs.length);

  console.log('\nSeed complete.');
  console.log('Login email: demo@seed.local');
  console.log('Password:    password123');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
