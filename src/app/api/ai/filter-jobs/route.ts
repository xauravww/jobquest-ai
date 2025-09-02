import { NextRequest, NextResponse } from 'next/server';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  description: string;
  url: string;
}

interface FilterCriteria {
  minSalary?: string;
  location?: string;
  jobType?: string;
  experience?: string;
  skills?: string;
  userQuery?: string;
}

// Simple AI filtering logic (in a real app, this would use an actual AI service)
function analyzeJob(job: Job, criteria: FilterCriteria) {
  let score = 50; // Base score
  let reasons: string[] = [];

  // Title matching
  if (criteria.userQuery) {
    const queryWords = criteria.userQuery.toLowerCase().split(' ');
    const titleWords = job.title.toLowerCase();
    const matchingWords = queryWords.filter(word => titleWords.includes(word));
    
    if (matchingWords.length > 0) {
      score += (matchingWords.length / queryWords.length) * 30;
      reasons.push(`Title matches ${matchingWords.length}/${queryWords.length} search terms`);
    }
  }

  // Location matching
  if (criteria.location && job.location.toLowerCase().includes(criteria.location.toLowerCase())) {
    score += 15;
    reasons.push('Location matches preference');
  }

  // Skills matching
  if (criteria.skills) {
    const skillWords = criteria.skills.toLowerCase().split(',').map(s => s.trim());
    const descriptionLower = job.description.toLowerCase();
    const matchingSkills = skillWords.filter(skill => descriptionLower.includes(skill));
    
    if (matchingSkills.length > 0) {
      score += (matchingSkills.length / skillWords.length) * 25;
      reasons.push(`Found ${matchingSkills.length}/${skillWords.length} required skills`);
    }
  }

  // Experience level matching
  if (criteria.experience) {
    const expLower = criteria.experience.toLowerCase();
    const descLower = job.description.toLowerCase();
    
    if (expLower.includes('entry') && (descLower.includes('entry') || descLower.includes('junior'))) {
      score += 10;
      reasons.push('Experience level matches (entry/junior)');
    } else if (expLower.includes('senior') && descLower.includes('senior')) {
      score += 10;
      reasons.push('Experience level matches (senior)');
    } else if (expLower.includes('mid') && (descLower.includes('mid') || descLower.includes('intermediate'))) {
      score += 10;
      reasons.push('Experience level matches (mid-level)');
    }
  }

  // Salary matching (basic check)
  if (criteria.minSalary && job.salary) {
    const minSalaryNum = parseInt(criteria.minSalary.replace(/[^0-9]/g, ''));
    const jobSalaryNum = parseInt(job.salary.replace(/[^0-9]/g, ''));
    
    if (jobSalaryNum >= minSalaryNum) {
      score += 15;
      reasons.push('Salary meets minimum requirement');
    } else {
      score -= 10;
      reasons.push('Salary below minimum requirement');
    }
  }

  // Company reputation boost (simple heuristic)
  const topCompanies = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'tesla', 'uber', 'airbnb'];
  if (topCompanies.some(company => job.company.toLowerCase().includes(company))) {
    score += 10;
    reasons.push('Well-known company');
  }

  // Remote work bonus
  if (job.location.toLowerCase().includes('remote') || job.description.toLowerCase().includes('remote')) {
    score += 5;
    reasons.push('Remote work available');
  }

  // Cap the score at 100
  score = Math.min(100, Math.max(0, score));

  return {
    score: Math.round(score),
    reason: reasons.join('; ') || 'Basic job analysis completed',
    isFiltered: score >= 60 // Jobs with 60+ score are considered good matches
  };
}

export async function POST(request: NextRequest) {
  try {
    const { jobs, criteria } = await request.json();

    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Jobs array is required' },
        { status: 400 }
      );
    }

    // Try to connect to the original local AI server first
    const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:1234';
    let analyzedJobs = [];

    try {
      // Use the original AI filtering logic
      const aiPromises = jobs.map(async (job) => {
        try {
          const prompt = buildAIPrompt(job, criteria);
          
          const aiResponse = await fetch(`${aiServerUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'qwen2.5-coder-3b-instruct',
              messages: [
                { 
                  role: 'system', 
                  content: `You are a job matching AI. Analyze if this job matches the user's criteria and provide a score from 0-100.
                  
                  Consider:
                  - Job title relevance to target role
                  - Location preferences
                  - Salary requirements
                  - Required skills match
                  - Experience level fit
                  - Company preferences
                  
                  Respond with JSON: {"score": number, "reason": "explanation", "isMatch": boolean}`
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 200
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            
            try {
              const analysis = JSON.parse(content);
              return {
                ...job,
                aiScore: analysis.score || 50,
                aiReason: analysis.reason || 'AI analysis completed',
                isFiltered: analysis.isMatch || analysis.score >= 60
              };
            } catch (parseError) {
              console.warn('Failed to parse AI response, using fallback');
              return analyzeJobFallback(job, criteria);
            }
          } else {
            throw new Error('AI server response not ok');
          }
        } catch (jobError) {
          console.warn('AI analysis failed for job, using fallback:', jobError);
          return analyzeJobFallback(job, criteria);
        }
      });

      analyzedJobs = await Promise.all(aiPromises);
      console.log('AI filtering completed using local AI server');

    } catch (aiServerError) {
      console.warn('Local AI server not available, using fallback analysis:', aiServerError);
      
      // Fallback to simple analysis
      analyzedJobs = jobs.map(job => analyzeJobFallback(job, criteria));
    }

    return NextResponse.json(analyzedJobs);

  } catch (error) {
    console.error('Error filtering jobs with AI:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildAIPrompt(job: any, criteria: any) {
  return `
Job Details:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Salary: ${job.salary || 'Not specified'}
Description: ${job.description}

User Criteria:
Target Role: ${criteria.targetRole || 'Not specified'}
Location Preference: ${criteria.location || 'Any'}
Minimum Salary: ${criteria.minSalary || 'Not specified'}
Required Skills: ${criteria.skills || 'Not specified'}
Experience Level: ${criteria.experience || 'Not specified'}
Date Range: ${criteria.dateFrom || 'Any'} to ${criteria.dateTo || 'Any'}

Analyze this job match and provide a score with reasoning.
  `;
}

function analyzeJobFallback(job: any, criteria: unknown) {
  const analysis = analyzeJob(job, criteria || {});
  
  return {
    ...job,
    aiScore: analysis.score,
    aiReason: analysis.reason,
    isFiltered: analysis.isFiltered
  };
}