import { NaukriParsedJob, NaukriUserProfile, getLatestNaukriJobs, getLatestNaukriProfile } from '@/lib/naukriService';

export interface TailoredJob extends NaukriParsedJob {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  reasons: string[];
  experienceFit: boolean;
  locationFit: boolean;
}

/**
 * Normalizes text into a clean token list
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * Calculates a match score (0 - 100) and rationale for a job against a user profile
 */
export function scoreJobForProfile(job: NaukriParsedJob, profile: NaukriUserProfile | null): TailoredJob {
  const defaultProfileSkills = ['full stack developer', 'next.js', 'react', 'node.js', 'typescript', 'javascript', 'ai integration', 'automation'];
  const userSkills = (profile?.skills && profile.skills.length > 0)
    ? profile.skills.map(s => s.toLowerCase().trim())
    : defaultProfileSkills;

  const targetRoles = (profile?.desiredRoles && profile.desiredRoles.length > 0)
    ? profile.desiredRoles.map(r => r.toLowerCase().trim())
    : ['full stack developer', 'software engineer', 'front end developer', 'backend developer', 'web developer'];

  const targetLocations = (profile?.desiredLocations && profile.desiredLocations.length > 0)
    ? profile.desiredLocations.map(l => l.toLowerCase().trim())
    : ['delhi', 'noida', 'gurgaon', 'gurugram', 'pune', 'bengaluru', 'bangalore', 'remote'];

  const jobTitleTokens = tokenize(job.title);
  const jobSkillTokens = job.skills.map(s => s.toLowerCase().trim());
  const jobLocationTokens = tokenize(job.location);

  // 1. Skill Overlap (up to 45 pts)
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const sk of job.skills) {
    const skLower = sk.toLowerCase().trim();
    const isMatched = userSkills.some(us => us.includes(skLower) || skLower.includes(us)) ||
      defaultProfileSkills.some(ds => skLower.includes(ds) || ds.includes(skLower));

    if (isMatched) {
      matchingSkills.push(sk);
    } else {
      missingSkills.push(sk);
    }
  }

  let skillScore = 0;
  if (job.skills.length > 0) {
    const ratio = matchingSkills.length / Math.min(job.skills.length, 6);
    skillScore = Math.min(45, Math.round(ratio * 45));
  } else {
    // If job has no tags, baseline score based on title
    skillScore = 20;
  }

  // 2. Title / Role Fit (up to 35 pts)
  let titleScore = 15;
  const matchesTargetRole = targetRoles.some(r => {
    const rTokens = tokenize(r);
    return rTokens.some(t => jobTitleTokens.includes(t));
  });

  if (matchesTargetRole) {
    titleScore += 20;
  }

  // Bonus for tech relevance keywords
  if (jobTitleTokens.some(t => ['full', 'stack', 'developer', 'engineer', 'ai', 'react', 'node', 'software'].includes(t))) {
    titleScore = Math.min(35, titleScore + 5);
  }

  // 3. Location Fit (up to 15 pts)
  let locationFit = false;
  let locationScore = 5; // Base points for all-India
  if (jobLocationTokens.some(t => t.includes('remote') || t.includes('hybrid'))) {
    locationFit = true;
    locationScore = 15;
  } else {
    locationFit = targetLocations.some(tl => {
      const tlTokens = tokenize(tl);
      return tlTokens.some(t => jobLocationTokens.includes(t));
    });
    if (locationFit) locationScore = 15;
  }

  // 4. Experience Fit (up to 5 pts)
  let experienceFit = true;
  let expScore = 5;
  if (job.experience) {
    // Look for minimum years
    const match = job.experience.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const minYears = parseInt(match[1], 10);
      if (minYears > 3) {
        experienceFit = false;
        expScore = 0;
      }
    }
  }

  const totalScore = Math.min(99, Math.max(40, skillScore + titleScore + locationScore + expScore));

  const reasons: string[] = [];
  if (matchesTargetRole) reasons.push('Role matches target career path');
  if (matchingSkills.length > 0) reasons.push(`Matches ${matchingSkills.length} key skills`);
  if (locationFit) reasons.push('Matches preferred job location');
  if (experienceFit) reasons.push('Experience bracket aligns with profile');

  return {
    ...job,
    matchScore: totalScore,
    matchingSkills,
    missingSkills: missingSkills.slice(0, 5),
    reasons,
    experienceFit,
    locationFit
  };
}

/**
 * Returns all deduplicated, AI-scored tailored jobs sorted by match score
 */
export function getTailoredJobs(): { profile: NaukriUserProfile | null; jobs: TailoredJob[] } {
  const profile = getLatestNaukriProfile();
  const rawJobs = getLatestNaukriJobs();

  // Deduplicate by clean ID and content hash
  const seen = new Set<string>();
  const tailored: TailoredJob[] = [];

  for (const job of rawJobs) {
    const contentKey = `${job.company.toLowerCase().trim()}:${job.title.toLowerCase().trim()}`;
    if (seen.has(job.jobId) || seen.has(contentKey)) continue;

    seen.add(job.jobId);
    seen.add(contentKey);

    const scored = scoreJobForProfile(job, profile);
    tailored.push(scored);
  }

  // Sort descending by match score
  tailored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    profile,
    jobs: tailored
  };
}
