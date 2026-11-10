import { describe, it, expect } from 'vitest';
import {
  contentFromProfile,
  normalizeContent,
  resolveResumeContent,
} from '@/lib/resumeRenderer';

/** A realistic user document shaped like src/models/User.ts profile. */
function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    email: 'demo@seed.local',
    name: 'Saurav',
    profile: {
      title: 'Software Developer',
      location: 'Bhiwani, Haryana',
      summary: 'Dedicated software developer building efficient, scalable apps.',
      skills: ['Languages:  JavaScript', 'TypeScript\nFrameworks:  Next.js', 'React', 'Node.js', 'JavaScript'],
      resumeEmail: 'saurav@example.com',
      linkedinUrl: 'linkedin.com/in/itsmesaurav',
      portfolioUrl: 'xauravww.vercel.app',
      workExperience: [
        {
          company: 'Digitech Services Pvt. Ltd.',
          position: 'Full Stack Developer (Contract, Remote) - Delhi',
          startDate: '2025-05-31T00:00:00.000Z',
          endDate: '',
          description: '- Architected systems\n- Built automation pipelines',
        },
      ],
      education: [
        {
          institution: 'BRCM College',
          degree: 'B.Tech',
          field: 'Computer Science',
          endDate: new Date('2024-06-30'),
        },
      ],
      projects: [
        {
          name: 'NebulaPlan',
          description: 'AI project planning tool.\n\nLive Demo: nebulaplan.vercel.app\nSource Code: project-planner-next',
          url: 'nebulaplan.vercel.app',
        },
      ],
      achievements: [
        { title: 'First Place', description: 'Won college tech exhibition' },
      ],
    },
    ...overrides,
  };
}

describe('contentFromProfile (generation → content snapshot)', () => {
  it('captures the full resume content from a profile', () => {
    const c = contentFromProfile(makeUser());

    expect(c.title).toBe('Software Developer');
    expect(c.location).toBe('Bhiwani, Haryana');
    expect(c.summary).toContain('Dedicated software developer');
    // resumeEmail wins over user.email
    expect(c.email).toBe('saurav@example.com');
    // URLs are stripped to a clean label
    expect(c.linkedin).toBe('linkedin.com/in/itsmesaurav');
    expect(c.portfolio).toBe('xauravww.vercel.app');
  });

  it('cleans and de-duplicates the skills list', () => {
    const c = contentFromProfile(makeUser());
    expect(c.skills).toContain('JavaScript');
    expect(c.skills).toContain('TypeScript');
    expect(c.skills).toContain('Next.js');
    expect(c.skills).toContain('React');
    expect(c.skills).toContain('Node.js');
    // de-duplicated
    expect(new Set(c.skills).size).toBe(c.skills.length);
  });

  it('maps experience entries to the renderer shape', () => {
    const c = contentFromProfile(makeUser());
    expect(c.workExperience).toHaveLength(1);
    const w = c.workExperience[0];
    expect(w.role).toBe('Full Stack Developer (Contract, Remote) - Delhi');
    expect(w.company).toBe('Digitech Services Pvt. Ltd.');
    expect(w.startDate).toBe('May 2025');
    expect(w.endDate).toBe('');
  });

  it('maps education entries to a full degree string + year', () => {
    const c = contentFromProfile(makeUser());
    expect(c.education).toHaveLength(1);
    const e = c.education[0];
    expect(e.degree).toBe('B.Tech in Computer Science');
    expect(e.school).toBe('BRCM College');
    expect(e.year).toBe('2024');
  });

  it('extracts live/code URLs out of project descriptions', () => {
    const c = contentFromProfile(makeUser());
    expect(c.projects).toHaveLength(1);
    const p = c.projects[0];
    expect(p.name).toBe('NebulaPlan');
    expect(p.liveUrl).toBe('https://nebulaplan.vercel.app');
    expect(p.codeUrl).toBe('https://github.com/project-planner-next');
    expect(p.description).not.toMatch(/Live Demo|Source Code/i);
  });

  it('combines achievement objects into strings', () => {
    const c = contentFromProfile(makeUser());
    expect(c.achievements).toContain('First Place: Won college tech exhibition');
  });

  it('falls back to bio when there is no summary', () => {
    const c = contentFromProfile(makeUser({ profile: { bio: 'Just a bio.' } }));
    expect(c.summary).toBe('Just a bio.');
  });
});

describe('normalizeContent (edit form payload → saved content)', () => {
  it('cleans the edited payload the same way generation does', () => {
    const c = normalizeContent({
      title: '  My Resume  ',
      location: 'Remote',
      summary: 'Updated summary',
      email: 'a@b.com',
      skills: ['React', ' Next.js ', '', 'React'],
      workExperience: [
        { role: ' Engineer ', company: 'Acme', startDate: 'May 2025', endDate: 'Present', description: '- Do stuff' },
      ],
      education: [{ degree: 'B.S.', school: 'Uni', year: '2020' }],
      projects: [{ name: 'Prop', description: 'Desc', liveUrl: 'prop.com', codeUrl: '' }],
      achievements: ['A one'],
    });

    expect(c.title).toBe('My Resume');
    expect(c.skills).toEqual(['React', 'Next.js']);
    expect(c.workExperience[0].role).toBe('Engineer');
    expect(c.education[0].school).toBe('Uni');
    expect(c.projects[0].name).toBe('Prop');
    expect(c.achievements).toEqual(['A one']);
  });

  it('drops empty experience/education/project entries', () => {
    const c = normalizeContent({
      workExperience: [{ role: '', company: '', startDate: '', endDate: '', description: '' }],
      education: [{ degree: '', school: '', year: '' }],
      projects: [{ name: '', description: '', liveUrl: '', codeUrl: '' }],
    });
    expect(c.workExperience).toHaveLength(0);
    expect(c.education).toHaveLength(0);
    expect(c.projects).toHaveLength(0);
  });
});

describe('resolveResumeContent (GET backfill for legacy resumes)', () => {
  it('passes through existing content unchanged', () => {
    const existing = { summary: 'Saved', skills: ['React'] };
    expect(resolveResumeContent(existing, makeUser())).toBe(existing);
  });

  it('backfills from the profile when the resume has no content snapshot', () => {
    const c = resolveResumeContent(null, makeUser());
    expect(c.summary).toContain('Dedicated software developer');
    expect(c.workExperience).toHaveLength(1);
    expect(c.projects).toHaveLength(1);
  });

  it('backfills when the content snapshot is an empty object', () => {
    const c = resolveResumeContent({}, makeUser());
    expect(c.skills.length).toBeGreaterThan(0);
  });
});
