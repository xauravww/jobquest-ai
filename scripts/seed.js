require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobquest-ai';
const DEMO_EMAIL = 'demo@seed.local';
const DEMO_PASSWORD = 'password123';

// Date helper: returns a Date offset by `days` from now at a given time.
const d = (days, hour = 9, minute = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  dt.setHours(hour, minute, 0, 0);
  return dt;
};

async function wipeDemoData(db) {
  const existing = await db.collection('users').findOne({ email: DEMO_EMAIL });
  if (!existing) return;

  const uid = existing._id;
  const targets = ['jobs', 'applications', 'reminders', 'calendarevents', 'contacts', 'followups', 'resumes', 'fleetingnotes', 'aicconfigs', 'followuphistories'];
  for (const col of targets) {
    try {
      await db.collection(col).deleteMany({ userId: uid });
    } catch (e) {
      // some collections may not exist; ignore
    }
  }
  await db.collection('fleetingnotes').deleteMany({ userEmail: DEMO_EMAIL });
  await db.collection('users').deleteMany({ _id: uid });
  console.log('Wiped previous demo data for', DEMO_EMAIL);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  await wipeDemoData(db);

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ---------------------------------------------------------------
  // 1. User
  // ---------------------------------------------------------------
  const userDoc = {
    email: DEMO_EMAIL,
    password: hashed,
    name: 'Demo User',
    role: 'user',
    isEmailVerified: true,
    isOnboarded: true,
    profile: {
      firstName: 'Demo',
      lastName: 'User',
      phone: '+91 98765 43210',
      title: 'Software Engineer',
      company: 'Freelance',
      location: 'Remote',
      bio: 'Full-stack developer with 3 years of experience building web products with React and Node.js.',
      summary: 'Full-stack engineer focused on scalable, user-friendly web applications.',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL', 'AWS'],
      experience: 3,
      experienceYears: 3,
      linkedinUrl: 'https://linkedin.com/in/demouser',
      githubUrl: 'https://github.com/demouser',
      portfolioUrl: 'https://demouser.dev',
      resumeEmail: DEMO_EMAIL,
      workExperience: [
        {
          company: 'Acme Software',
          position: 'Full Stack Developer',
          startDate: d(-700),
          endDate: d(-30),
          description: 'Built internal dashboards and REST APIs used by 40k monthly users.'
        }
      ],
      education: [
        {
          institution: 'National Institute of Technology',
          degree: 'B.Tech',
          field: 'Computer Science',
          startDate: d(-2200),
          endDate: d(-1450)
        }
      ],
      projects: [
        { name: 'JobQuest AI', description: 'AI-assisted job application tracker.', url: 'https://github.com/demouser/jobquest-ai' }
      ],
      certifications: [{ name: 'AWS Certified Developer', issuer: 'Amazon Web Services', date: d(-400) }]
    },
    preferences: {
      jobTypes: ['full-time', 'remote'],
      locations: ['Remote', 'Bangalore', 'Hyderabad'],
      salaryRange: { min: 1200000, max: 2400000, currency: 'INR' },
      remoteWork: true,
      targetRole: 'Senior Frontend Engineer',
      targetCompanies: ['Stripe', 'Google', 'Razorpay', 'Flipkart'],
      notifications: { email: true, push: true, jobAlerts: true, applicationUpdates: true }
    },
    aiConfig: { provider: 'lm-studio', model: 'local-model', enabled: true, apiUrl: 'http://localhost:1234' },
    telegramConfig: { enabled: false },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const userRes = await db.collection('users').insertOne(userDoc);
  const userId = userRes.insertedId;
  console.log('Created user:', DEMO_EMAIL);

  // ---------------------------------------------------------------
  // 2. Resumes
  // ---------------------------------------------------------------
  const resumes = [
    {
      userId,
      title: 'Primary Resume',
      description: 'General full-stack resume',
      type: 'standard',
      database: 'default',
      isDefault: true,
      isActive: true,
      usageCount: 0,
      version: 1,
      atsScore: 82,
      atsKeywords: ['React', 'Node.js', 'TypeScript'],
      personalInfo: {
        fullName: 'Demo User',
        email: DEMO_EMAIL,
        phone: '+91 98765 43210',
        location: 'Remote, India',
        website: 'https://demouser.dev',
        linkedin: 'https://linkedin.com/in/demouser',
        github: 'https://github.com/demouser'
      },
      summary: 'Full-stack engineer with 3 years of experience shipping products with React and Node.js.',
      experience: [
        {
          company: 'Acme Software',
          position: 'Full Stack Developer',
          startDate: d(-700),
          endDate: d(-30),
          current: false,
          description: 'Built dashboards and APIs used by 40k monthly users.',
          technologies: ['React', 'Node.js', 'MongoDB']
        }
      ],
      education: [
        {
          institution: 'National Institute of Technology',
          degree: 'B.Tech',
          field: 'Computer Science',
          startDate: d(-2200),
          endDate: d(-1450),
          gpa: '8.4'
        }
      ],
      skills: { technical: ['JavaScript', 'TypeScript', 'Node.js'], frameworks: ['React', 'Express'], tools: ['Git', 'Docker'] },
      projects: [{ name: 'JobQuest AI', description: 'AI-assisted job tracker.', technologies: ['React', 'Next.js'], github: 'https://github.com/demouser/jobquest-ai' }],
      content: {
        title: 'Demo User',
        location: 'Remote, India',
        summary: 'Full-stack engineer with 3 years of experience.',
        email: DEMO_EMAIL,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        workExperience: [{ role: 'Full Stack Developer', company: 'Acme Software', startDate: '2023-01', endDate: '2025-11', description: 'Built dashboards and APIs.' }],
        education: [{ degree: 'B.Tech', school: 'NIT', year: '2021' }],
        projects: [{ name: 'JobQuest AI', description: 'AI-assisted job tracker.', codeUrl: 'https://github.com/demouser/jobquest-ai' }]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId,
      title: 'ATS Optimized Resume',
      description: 'Keyword-optimized resume for applications',
      type: 'ats_optimized',
      database: 'default',
      isDefault: false,
      isActive: true,
      usageCount: 0,
      version: 1,
      atsScore: 91,
      atsKeywords: ['React', 'Node.js', 'TypeScript', 'GraphQL'],
      personalInfo: {
        fullName: 'Demo User',
        email: DEMO_EMAIL,
        phone: '+91 98765 43210',
        location: 'Remote, India',
        linkedin: 'https://linkedin.com/in/demouser',
        github: 'https://github.com/demouser'
      },
      summary: 'Full-stack engineer with 3 years of experience.',
      skills: { technical: ['JavaScript', 'TypeScript', 'Node.js'], frameworks: ['React', 'Express'], tools: ['Git', 'Docker'] },
      content: {
        title: 'Demo User',
        location: 'Remote, India',
        summary: 'Full-stack engineer with 3 years of experience.',
        email: DEMO_EMAIL,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        workExperience: [{ role: 'Full Stack Developer', company: 'Acme Software', startDate: '2023-01', endDate: '2025-11', description: 'Built dashboards and APIs.' }],
        education: [{ degree: 'B.Tech', school: 'NIT', year: '2021' }],
        projects: [{ name: 'JobQuest AI', description: 'AI-assisted job tracker.' }]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const resumeRes = await db.collection('resumes').insertMany(resumes);
  const resumeIds = Object.values(resumeRes.insertedIds);
  console.log('Created resumes:', resumeIds.length);

  // ---------------------------------------------------------------
  // 3. Jobs (saved / search pool)
  // ---------------------------------------------------------------
  const jobsData = [
    { title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', salary: '₹18-24 LPA', skills: ['React', 'TypeScript', 'GraphQL'], aiScore: 88 },
    { title: 'Full Stack Developer', company: 'Razorpay', location: 'Bangalore', salary: '₹12-18 LPA', skills: ['Node.js', 'React'], aiScore: 84 },
    { title: 'Software Engineer II', company: 'Google', location: 'Hyderabad', salary: '₹25-35 LPA', skills: ['C++', 'Python'], aiScore: 76 },
    { title: 'React Developer', company: 'Flipkart', location: 'Bangalore', salary: '₹10-14 LPA', skills: ['React', 'Redux'], aiScore: 80 },
    { title: 'Backend Engineer', company: 'Swiggy', location: 'Remote', salary: '₹14-20 LPA', skills: ['Node.js', 'MongoDB'], aiScore: 82 },
    { title: 'Frontend Engineer', company: 'Zomato', location: 'Gurgaon', salary: '₹12-16 LPA', skills: ['React', 'TypeScript'], aiScore: 78 },
    { title: 'Full Stack Engineer', company: 'Jio', location: 'Mumbai', salary: '₹14-22 LPA', skills: ['JavaScript', 'Node.js', 'React'], aiScore: 74 },
    { title: 'Product Engineer', company: 'CRED', location: 'Bangalore', salary: '₹20-30 LPA', skills: ['React', 'Node.js', 'AWS'], aiScore: 86 }
  ];

  const jobDocs = jobsData.map((j, i) => ({
    jobId: `seed-job-${i + 1}`,
    title: j.title,
    company: j.company,
    location: j.location,
    description: `${j.title} at ${j.company}. Responsibilities include building high-quality software with ${j.skills.join(', ')}.`,
    salary: j.salary,
    jobType: 'full-time',
    experienceLevel: i % 2 === 0 ? 'senior' : 'mid',
    skills: j.skills,
    source: 'seed',
    url: `https://example.com/jobs/seed-job-${i + 1}`,
    applyUrl: `https://example.com/jobs/seed-job-${i + 1}/apply`,
    datePosted: d(-(i + 2)),
    userId,
    status: 'saved',
    isActive: true,
    aiScore: j.aiScore,
    aiReasons: ['Matches your skills', 'Relevant tech stack', 'Remote friendly'],
    matchingSkills: j.skills,
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const jobRes = await db.collection('jobs').insertMany(jobDocs);
  const jobIds = Object.values(jobRes.insertedIds);
  console.log('Created jobs:', jobIds.length);

  // ---------------------------------------------------------------
  // 4. Applications (with interviews + an offer)
  // ---------------------------------------------------------------
  const appStatuses = ['applied', 'under_review', 'phone_screening', 'technical_interview', 'offer_received', 'rejected'];
  const appDocs = jobIds.slice(0, 6).map((jid, i) => {
    const doc = {
      userId,
      jobId: jid,
      applicationId: `APP-SEED-${i + 1}`,
      status: appStatuses[i],
      appliedDate: d(-(i + 2) * 2),
      lastStatusUpdate: d(-(i + 1)),
      expectedResponseDate: d(Math.max(3, 10 - i)),
      applicationMethod: 'manual',
      platform: i % 2 === 0 ? 'linkedin' : 'company_website',
      resumeUsed: resumeIds[0],
      notes: 'Application tracked via JobQuest demo.',
      tags: ['seed', 'demo'],
      priority: i < 2 ? 'high' : i === 4 ? 'high' : 'medium',
      createdAt: d(-(i + 2) * 2),
      updatedAt: new Date()
    };

    if (i === 2) {
      doc.interviews = [
        { scheduledDate: d(2, 14, 0), type: 'phone', duration: 30, interviewer: 'Priya Sharma', notes: 'Intro call', result: 'pending' }
      ];
    }
    if (i === 3) {
      doc.interviews = [
        { scheduledDate: d(4, 11, 0), type: 'technical', duration: 60, interviewer: 'Rahul Verma', notes: 'System design round', result: 'pending' }
      ];
    }
    if (i === 4) {
      doc.offer = {
        salary: 2200000,
        currency: 'INR',
        benefits: ['Health insurance', 'Gym membership', 'Annual bonus'],
        startDate: d(45),
        responseDeadline: d(7),
        negotiationNotes: 'Can negotiate for remote flexibility.'
      };
      doc.interviews = [
        { scheduledDate: d(-6, 15, 0), type: 'video', duration: 45, interviewer: 'Hiring Manager', result: 'passed' }
      ];
    }
    return doc;
  });

  const appRes = await db.collection('applications').insertMany(appDocs);
  const applicationIds = Object.values(appRes.insertedIds);
  console.log('Created applications:', applicationIds.length);

  // ---------------------------------------------------------------
  // 5. Reminders
  // ---------------------------------------------------------------
  const reminders = [
    { title: 'Follow up on Stripe application', description: 'Send a status inquiry email.', applicationId: applicationIds[0], jobId: jobIds[0], type: 'follow_up', status: 'pending', priority: 'high', dueDate: d(1, 10, 0), dueTime: '10:00', color: '#ff6b4a', tags: ['follow-up'] },
    { title: 'Prepare for Google technical interview', description: 'Review system design and DS&A.', applicationId: applicationIds[3], jobId: jobIds[2], type: 'interview_prep', status: 'pending', priority: 'high', dueDate: d(3, 18, 0), dueTime: '18:00', color: '#8b5cf6', tags: ['interview'] },
    { title: 'Stripe offer response deadline', description: 'Respond to the offer by today.', applicationId: applicationIds[4], jobId: jobIds[0], type: 'offer_response', status: 'pending', priority: 'urgent', dueDate: d(0, 17, 0), dueTime: '17:00', color: '#3fb950', tags: ['offer'] },
    { title: 'Razorpay phone screen call', description: 'Intro call with recruiter.', applicationId: applicationIds[2], jobId: jobIds[1], type: 'interview_scheduled', status: 'pending', priority: 'medium', dueDate: d(2, 14, 0), dueTime: '14:00', color: '#3b82f6', tags: ['interview'] },
    { title: 'Check Flipkart application status', description: 'Follow up on submitted application.', applicationId: applicationIds[5], jobId: jobIds[3], type: 'follow_up', status: 'pending', priority: 'low', dueDate: d(-2, 11, 0), dueTime: '11:00', color: '#d9a441', tags: ['follow-up'] },
    { title: 'Weekly job search review', description: 'Review saved jobs and apply to top matches.', type: 'job_search', status: 'pending', priority: 'medium', dueDate: d(5, 9, 0), dueTime: '09:00', color: '#ff6b4a', tags: ['planning'] },
    { title: 'Networking with Priya (Stripe)', description: 'Connect and build rapport.', type: 'networking', status: 'completed', priority: 'low', dueDate: d(-5, 16, 0), dueTime: '16:00', completedAt: d(-5, 16, 30), color: '#8b5cf6', tags: ['networking'] }
  ];

  const remDocs = reminders.map((r, i) => ({
    userId,
    applicationId: r.applicationId || undefined,
    jobId: r.jobId || undefined,
    title: r.title,
    description: r.description || '',
    dueDate: r.dueDate,
    dueTime: r.dueTime,
    type: r.type,
    priority: r.priority,
    status: r.status,
    completedAt: r.completedAt,
    isRecurring: false,
    tags: r.tags || [],
    color: r.color,
    notifications: [{ type: 'in_app', timing: 'on_time', sent: false }],
    createdAt: d(-5 + i),
    updatedAt: new Date()
  }));

  await db.collection('reminders').insertMany(remDocs);
  console.log('Created reminders:', remDocs.length);

  // ---------------------------------------------------------------
  // 6. Calendar events
  // ---------------------------------------------------------------
  const events = [
    { title: 'Google Technical Interview', type: 'technical_interview', status: 'confirmed', startDate: d(3, 11, 0), endDate: d(3, 12, 0), applicationId: applicationIds[3], jobId: jobIds[2], location: { isVirtual: true, meetingLink: 'https://meet.example.com/tech-interview' }, attendees: [{ name: 'Ananya Iyer', role: 'interviewer', company: 'Google', responseStatus: 'accepted' }], preparationNotes: 'Review resume and be ready for deep-dive.' },
    { title: 'Stripe Offer Negotiation Call', type: 'meeting', status: 'confirmed', startDate: d(5, 15, 0), endDate: d(5, 15, 45), applicationId: applicationIds[4], jobId: jobIds[0], location: { isVirtual: true, meetingLink: 'https://meet.example.com/offer' }, attendees: [{ name: 'Priya Sharma', role: 'recruiter', company: 'Stripe', responseStatus: 'accepted' }] },
    { title: 'Razorpay Phone Screening', type: 'phone_screening', status: 'scheduled', startDate: d(2, 14, 0), endDate: d(2, 14, 30), applicationId: applicationIds[2], jobId: jobIds[1], location: { isVirtual: true }, attendees: [{ name: 'Rahul Verma', role: 'hiring_manager', company: 'Razorpay', responseStatus: 'accepted' }] },
    { title: 'Application deadline: Zomato', type: 'deadline', status: 'scheduled', startDate: d(6, 23, 59), endDate: d(6, 23, 59), isAllDay: true, applicationId: applicationIds[0], jobId: jobIds[5], location: {} },
    { title: 'Demo Tech Meetup', type: 'networking_event', status: 'scheduled', startDate: d(8, 18, 0), endDate: d(8, 21, 0), location: { address: 'Bangalore Convention Center', isVirtual: false } }
  ];

  const eventDocs = events.map((e) => ({
    userId,
    applicationId: e.applicationId || undefined,
    jobId: e.jobId || undefined,
    title: e.title,
    description: '',
    startDate: e.startDate,
    endDate: e.endDate,
    isAllDay: e.isAllDay || false,
    timezone: 'IST',
    location: e.location || {},
    type: e.type,
    status: e.status,
    attendees: e.attendees || [],
    reminders: [{ type: 'popup', timing: 30, sent: false }],
    color: e.type === 'interview' || e.type === 'technical_interview' || e.type === 'phone_screening' ? '#3b82f6' : e.type === 'deadline' ? '#e5534b' : '#8b5cf6',
    priority: e.type === 'deadline' ? 'high' : 'medium',
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await db.collection('calendarevents').insertMany(eventDocs);
  console.log('Created calendar events:', eventDocs.length);

  // ---------------------------------------------------------------
  // 7. Fleeting notes
  // ---------------------------------------------------------------
  const notes = [
    { content: 'Research Stripe engineering culture before offer call.', userEmail: DEMO_EMAIL, source: 'web', tags: ['stripe', 'research'] },
    { content: 'Need to update portfolio with the new dashboard project.', userEmail: DEMO_EMAIL, source: 'web', tags: ['portfolio'] },
    { content: 'Ask about remote work policy in Google rounds.', userEmail: DEMO_EMAIL, source: 'web', tags: ['google', 'questions'] },
    { content: 'Connect with Priya on LinkedIn after the call.', userEmail: DEMO_EMAIL, source: 'web', tags: ['networking'] }
  ];
  await db.collection('fleetingnotes').insertMany(notes);
  console.log('Created fleeting notes:', notes.length);

  // ---------------------------------------------------------------
  // 8. Contacts
  // ---------------------------------------------------------------
  const contacts = [
    { name: 'Priya Sharma', email: 'priya.sharma@stripe.com', role: 'Senior Recruiter', company: 'Stripe', relationshipType: 'recruiter', status: 'active', priority: 'high', tags: ['stripe'], lastContactDate: d(-3), nextFollowUpDate: d(4), communications: [{ date: d(-3), type: 'interview', direction: 'incoming', notes: 'Offer discussion call.' }] },
    { name: 'Rahul Verma', email: 'rahul.verma@razorpay.com', role: 'Hiring Manager', company: 'Razorpay', relationshipType: 'hiring_manager', status: 'active', priority: 'medium', tags: ['razorpay'], lastContactDate: d(-6), nextFollowUpDate: d(2) },
    { name: 'Ananya Iyer', email: 'ananya.iyer@google.com', role: 'Technical Recruiter', company: 'Google', relationshipType: 'recruiter', status: 'active', priority: 'high', tags: ['google'], lastContactDate: d(-2), nextFollowUpDate: d(3) },
    { name: 'Mohammed Ali', email: 'mohammed.ali@flipkart.com', role: 'Talent Partner', company: 'Flipkart', relationshipType: 'recruiter', status: 'active', priority: 'medium', tags: ['flipkart'], lastContactDate: d(-10), nextFollowUpDate: d(1) }
  ];

  const contactDocs = contacts.map((c) => ({
    userId,
    name: c.name,
    email: c.email,
    role: c.role,
    company: c.company,
    department: '',
    notes: '',
    tags: c.tags,
    status: c.status,
    priority: c.priority,
    lastContactDate: c.lastContactDate,
    nextFollowUpDate: c.nextFollowUpDate,
    contactFrequency: 'as_needed',
    relationshipType: c.relationshipType,
    howMet: 'Application process',
    communications: c.communications || [],
    reminders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const contactRes = await db.collection('contacts').insertMany(contactDocs);
  const contactIds = Object.values(contactRes.insertedIds);
  console.log('Created contacts:', contactIds.length);

  // ---------------------------------------------------------------
  // 9. Follow-ups
  // ---------------------------------------------------------------
  const followUps = [
    { contactId: contactIds[0], applicationId: applicationIds[4], jobId: jobIds[0], type: 'thank_you', subject: 'Thank you for the Stripe offer', message: 'Thank you for the offer and the call today.', scheduledDate: d(1, 9, 0), scheduledTime: '09:00', status: 'scheduled', priority: 'high' },
    { contactId: contactIds[2], applicationId: applicationIds[3], jobId: jobIds[2], type: 'interview_follow_up', subject: 'Follow-up on Google interview', message: 'Following up after the technical interview.', scheduledDate: d(4, 12, 0), scheduledTime: '12:00', status: 'scheduled', priority: 'medium' },
    { contactId: contactIds[1], applicationId: applicationIds[2], jobId: jobIds[1], type: 'application_follow_up', subject: 'Status check — Razorpay application', message: 'Checking in on my application status.', scheduledDate: d(0, 10, 0), scheduledTime: '10:00', status: 'scheduled', priority: 'medium' },
    { contactId: contactIds[3], applicationId: applicationIds[5], jobId: jobIds[3], type: 'status_inquiry', subject: 'Follow-up on Flipkart application', message: 'Any update on my submitted application?', scheduledDate: d(-1, 15, 0), scheduledTime: '15:00', status: 'overdue', priority: 'low' }
  ];

  const followUpDocs = followUps.map((f) => ({
    userId,
    contactId: f.contactId,
    applicationId: f.applicationId,
    jobId: f.jobId,
    type: f.type,
    subject: f.subject,
    message: f.message,
    scheduledDate: f.scheduledDate,
    scheduledTime: f.scheduledTime,
    status: f.status,
    priority: f.priority,
    isAutoGenerated: false,
    tags: [],
    reminders: [],
    channelDetails: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await db.collection('followups').insertMany(followUpDocs);
  console.log('Created follow-ups:', followUpDocs.length);

  // ---------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------
  console.log('\nSeed complete.');
  console.log('Login email:', DEMO_EMAIL);
  console.log('Password:   ', DEMO_PASSWORD);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
