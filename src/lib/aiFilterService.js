/**
 * AI Filter Service - Provides AI-powered job filtering capabilities
 * Integrates with local AI server for advanced job analysis
 */

class AiFilterService {
  constructor() {
    this.aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:1234';
  }

  /**
   * Quick hiring filter using keyword matching
   */
  quickHiringFilter(jobs) {
    const hiringKeywords = [
      'hiring', 'recruiting', 'looking for', 'seeking', 'join our team',
      'we are hiring', 'now hiring', 'immediate opening', 'urgent requirement',
      'apply now', 'send resume', 'send cv', 'job opening', 'vacancy',
      'position available', 'career opportunity'
    ];

    return jobs.filter(job => {
      const content = (job.title + ' ' + job.content + ' ' + job.description).toLowerCase();
      return hiringKeywords.some(keyword => content.includes(keyword));
    });
  }

  /**
   * AI-powered job filtering with confidence scoring
   */
  async filterResults(jobs, filters = {}) {
    try {
      const {
        onlyHiringPosts = true,
        minConfidence = 60,
        location = null,
        postedAfter = null
      } = filters;

      // Process jobs in chunks to avoid overwhelming the AI server
      const chunkSize = 5;
      const chunks = [];
      
      for (let i = 0; i < jobs.length; i += chunkSize) {
        chunks.push(jobs.slice(i, i + chunkSize));
      }

      let filteredJobs = [];

      for (const chunk of chunks) {
        try {
          const chunkResults = await this.analyzeJobChunk(chunk, {
            onlyHiringPosts,
            minConfidence,
            location,
            postedAfter
          });
          
          filteredJobs = filteredJobs.concat(chunkResults);
          
          // Small delay between chunks
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (chunkError) {
          console.error('Error processing chunk:', chunkError);
          // Fallback to quick filter for this chunk
          if (onlyHiringPosts) {
            filteredJobs = filteredJobs.concat(this.quickHiringFilter(chunk));
          } else {
            filteredJobs = filteredJobs.concat(chunk);
          }
        }
      }

      return filteredJobs;
    } catch (error) {
      console.error('AI filtering error:', error);
      // Fallback to quick filter
      return filters.onlyHiringPosts ? this.quickHiringFilter(jobs) : jobs;
    }
  }

  /**
   * Analyze a chunk of jobs using AI
   */
  async analyzeJobChunk(jobs, filters) {
    try {
      const prompt = this.buildAnalysisPrompt(jobs, filters);
      
      const response = await fetch(`${this.aiServerUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'local-model',
          messages: [
            {
              role: 'system',
              content: 'You are a job analysis AI. Analyze job postings and return structured JSON responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`AI server error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No AI response received');
      }

      return this.parseAIResponse(aiResponse, jobs, filters);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt for AI
   */
  buildAnalysisPrompt(jobs, filters) {
    const jobsText = jobs.map((job, index) => 
      `Job ${index + 1}:\nTitle: ${job.title}\nCompany: ${job.company}\nContent: ${job.content || job.description}\n`
    ).join('\n');

    let prompt = `Analyze these job postings and determine which ones are actual hiring posts (not just company descriptions or news). For each job, provide a confidence score (0-100) and brief reason.

${jobsText}

Please respond with a JSON array where each object has:
- jobIndex: number (1-based index)
- isHiring: boolean
- confidence: number (0-100)
- reason: string (brief explanation)

`;

    if (filters.onlyHiringPosts) {
      prompt += `Focus on identifying genuine hiring posts with confidence >= ${filters.minConfidence}.`;
    }

    if (filters.location) {
      prompt += ` Also consider location relevance for: ${filters.location}.`;
    }

    return prompt;
  }

  /**
   * Parse AI response and filter jobs
   */
  parseAIResponse(aiResponse, jobs, filters) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      const filteredJobs = [];

      analysis.forEach(item => {
        const jobIndex = item.jobIndex - 1; // Convert to 0-based index
        if (jobIndex >= 0 && jobIndex < jobs.length) {
          const job = jobs[jobIndex];
          
          // Add AI analysis data to job
          job.aiScore = item.confidence;
          job.aiReason = item.reason;
          job.isHiring = item.isHiring;

          // Apply filters
          if (filters.onlyHiringPosts) {
            if (item.isHiring && item.confidence >= filters.minConfidence) {
              filteredJobs.push(job);
            }
          } else {
            filteredJobs.push(job);
          }
        }
      });

      return filteredJobs;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to original jobs with default scores
      return jobs.map(job => ({
        ...job,
        aiScore: 50,
        aiReason: 'AI analysis failed, using fallback',
        isHiring: true
      }));
    }
  }

  /**
   * Analyze single content for health check
   */
  async analyzeContent(content) {
    try {
      const response = await fetch(`${this.aiServerUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'local-model',
          messages: [
            {
              role: 'system',
              content: 'You are a job analysis AI. Analyze the given content and determine if it\'s a hiring post.'
            },
            {
              role: 'user',
              content: `Analyze this content and determine if it's a hiring post: "${content}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error(`AI server error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      return {
        content,
        analysis: aiResponse || 'No analysis available',
        isHiring: aiResponse ? aiResponse.toLowerCase().includes('hiring') : false,
        confidence: aiResponse ? 75 : 0
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      return {
        content,
        analysis: `AI analysis failed: ${error.message}`,
        isHiring: false,
        confidence: 0
      };
    }
  }
}

module.exports = AiFilterService;