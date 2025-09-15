/**
 * AI Filter Service - Provides AI-powered job filtering capabilities
 * Supports multiple AI providers: LM Studio, Ollama, Gemini, etc.
 */

class AiFilterService {
  constructor() {
    this.defaultConfig = {
      provider: 'lm-studio',
      apiUrl: 'http://localhost:1234',
      model: 'local-model',
      apiKey: ''
    };
    this.loadConfig();
  }

  loadConfig() {
    // On server side, always use default config
    // Config will be set via saveConfig() method when called from API
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-provider-config');
      if (saved) {
        try {
          this.config = { ...this.defaultConfig, ...JSON.parse(saved) };
        } catch (e) {
          console.warn('Failed to parse saved AI config, using defaults');
          this.config = { ...this.defaultConfig };
        }
      } else {
        this.config = { ...this.defaultConfig };
      }
    } else {
      // Server-side: don't try to load from localStorage
      this.config = { ...this.defaultConfig };
    }
  }

  saveConfig(config) {
    this.config = { ...this.config, ...config };
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-provider-config', JSON.stringify(this.config));
    }
  }

  getConfig() {
    return { ...this.config };
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
      const { provider, apiUrl, model, apiKey } = this.config;

      let response;
      let requestBody;
      let headers = {
        'Content-Type': 'application/json',
      };

      switch (provider) {
        case 'lm-studio':
        case 'ollama':
          requestBody = {
            model: model,
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
          };
          break;

        case 'gemini':
          // For Gemini, we'll use a different API format
          requestBody = {
            contents: [{
              parts: [{
                text: `${prompt}\n\nPlease respond with a JSON array where each object has: jobIndex, isHiring, confidence, reason.`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            }
          };
          headers = {
            ...headers,
            'x-goog-api-key': apiKey
          };
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const endpoint = provider === 'gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `${apiUrl}/v1/chat/completions`;

      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`AI server error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let aiResponse;

      if (provider === 'gemini') {
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        aiResponse = data.choices?.[0]?.message?.content;
      }

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
   * Generate cover letter using AI
   */
  async generateCoverLetter(systemPrompt, userPrompt) {
    try {
      const { provider, apiUrl, model, apiKey } = this.config;

      let response;
      let requestBody;
      let headers = {
        'Content-Type': 'application/json',
      };

      switch (provider) {
        case 'lm-studio':
        case 'ollama':
          requestBody = {
            model: model,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          };
          break;

        case 'gemini':
          requestBody = {
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\n${userPrompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          };
          headers = {
            ...headers,
            'x-goog-api-key': apiKey
          };
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const endpoint = provider === 'gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `${apiUrl}/v1/chat/completions`;

      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`AI server error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let aiResponse;

      if (provider === 'gemini') {
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        aiResponse = data.choices?.[0]?.message?.content;
      }

      if (!aiResponse) {
        throw new Error('No AI response received');
      }

      return aiResponse.trim();
    } catch (error) {
      console.error('Cover letter generation error:', error);
      throw error;
    }
  }

  /**
   * Analyze single content for health check
   */
  async analyzeContent(content) {
    try {
      const { provider, apiUrl, model, apiKey } = this.config;

      let response;
      let requestBody;
      let headers = {
        'Content-Type': 'application/json',
      };

      const prompt = `Analyze this content and determine if it's a hiring post: "${content}"`;

      switch (provider) {
        case 'lm-studio':
        case 'ollama':
          requestBody = {
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a job analysis AI. Analyze the given content and determine if it\'s a hiring post.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 200
          };
          break;

        case 'gemini':
          requestBody = {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 200,
            }
          };
          headers = {
            ...headers,
            'x-goog-api-key': apiKey
          };
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const endpoint = provider === 'gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `${apiUrl}/v1/chat/completions`;

      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`AI server error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let aiResponse;

      if (provider === 'gemini') {
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        aiResponse = data.choices?.[0]?.message?.content;
      }

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

export default AiFilterService;
