// Removed GoogleGenerativeAI import - using AI proxy server instead

interface NaukriTokens {
    authorization: string;
    cookies: string;
}

interface JobSearchCriteria {
    keyword: string;
    location: string;
    experience?: number;
    salary?: string; // e.g., "6to10"
    pageNo?: number;
}

export class NaukriService {
    private static BASE_URL = 'https://www.naukri.com';
    private static LOGIN_URL = `${NaukriService.BASE_URL}/central-login-services/v1/login`;
    private static SEARCH_URL = `${NaukriService.BASE_URL}/jobapi/v3/search`;
    private static APPLY_URL = `${NaukriService.BASE_URL}/apply/v5/regapply`;



    private async retryWithBackoff<T>(
        fn: () => Promise<T>,
        retries: number = 3,
        delay: number = 1000,
        backoffFactor: number = 2
    ): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            if (retries > 0 && this.shouldRetry(error)) {
                console.log(`Request failed, retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.retryWithBackoff(fn, retries - 1, delay * backoffFactor);
            }
            throw error;
        }
    }

    private shouldRetry(error: any): boolean {
        // Retry on network errors, 5xx errors, or rate limiting
        return !error.status || error.status >= 500 || error.status === 429;
    }

    async login(username: string, pass: string): Promise<NaukriTokens> {
        return this.retryWithBackoff(async () => {
            const response = await fetch(NaukriService.LOGIN_URL, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
                    'appid': '121',
                    'cache-control': 'no-cache',
                    'clientid': 'd3skt0p',
                    'content-type': 'application/json',
                    'gid': 'LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'nkparam': 'jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==',
                    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'x-requested-with': 'XMLHttpRequest',
                    'systemid': 'Naukri',
                },
            });

            if (response.status === 401) {
                const error = new Error('Session expired. Please login again.');
                (error as any).status = 401;
                throw error;
            }

            if (response.status === 429) {
                const error = new Error('Rate limit exceeded. Please try again later.');
                (error as any).status = 429;
                throw error;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Search failed response:', response.status, errorText);
                const error = new Error(`Search failed with status: ${response.status}`);
                (error as any).status = response.status;
                throw error;
            }

            return await response.json();
        });
    }

    async searchJobs(criteria: JobSearchCriteria, tokens: NaukriTokens) {
        return this.retryWithBackoff(async () => {
            const params = new URLSearchParams({
                noOfResults: '20',
                urlType: 'search_by_key_loc',
                searchType: 'adv',
                keyword: criteria.keyword,
                location: "pune, mumbai, bengaluru, bangalore",
                pageNo: (criteria.pageNo || 1).toString(),
                sort: 'p',
                k: criteria.keyword,
                l: "pune, mumbai, bengaluru, bangalore",
                nignbevent_src: 'jobsearchDeskGNB',
                src: 'cluster',
                latLong: '18.7506117_73.8764436',
                sid: '17143714288347830_8',
            });

            // Add experience and salary filters
            params.append('experience', '3');
            ['6to10', '10to15', '15to25', '25to50', '50to75', '75to100'].forEach(filter => {
                params.append('ctcFilter', filter);
            });

            const response = await fetch(`${NaukriService.SEARCH_URL}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
                    'appid': '121',
                    'cache-control': 'no-cache',
                    'clientid': 'd3skt0p',
                    'content-type': 'application/json',
                    'gid': 'LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'nkparam': 'jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==',
                    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'x-requested-with': 'XMLHttpRequest',
                    'systemid': 'Naukri',
                    'Referer-Policy': 'strict-origin-when-cross-origin',
                    'authorization': `Bearer ${tokens.authorization}`,
                    'cookie': `nauk_at=${tokens.authorization}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Search failed response:', response.status, errorText);
                const error = new Error(`Search failed with status: ${response.status}`);
                (error as any).status = response.status;
                throw error;
            }

            return await response.json();
        });
    }

    async applyJob(jobId: string, tokens: NaukriTokens, answers: any = {}, userProfile?: string, aiConfig?: any, retryCount: number = 0): Promise<any> {
        throw new Error("Apply requires full browser session cookies. Not supported in API mode. Use browser automation for apply functionality.");
    }



    async generateAnswers(questionnaire: any[], userProfile: string, aiConfig?: any): Promise<any> {
        const answers: any = {};

        // Use AI proxy server instead of Gemini
        const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:1234';
        const provider = aiConfig?.provider || 'lm-studio';
        const model = aiConfig?.aiModel || 'local-model';
        const apiUrl = aiConfig?.apiUrl || aiServerUrl;

        for (const question of questionnaire) {
            const prompt = `
        You are applying for a job. Answer the following question based on this user profile:

        User Profile:
        ${userProfile}

        Question: ${question.questionName}
        Type: ${question.questionType}
        Options: ${JSON.stringify(question.answerOption || {})}

        Provide ONLY the answer value.
        If it's a selection from options, provide the key (e.g., "1", "2").
        If it's a text answer, provide the text.
        If you are unsure, provide a generic positive answer.
      `;

            try {
                let response;
                let requestBody;
                let headers: Record<string, string> = { 'Content-Type': 'application/json' };

                if (provider === 'gemini') {
                    // Fallback for Gemini if configured
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
                    headers['x-goog-api-key'] = aiConfig?.apiKey || '';
                } else {
                    // Default to OpenAI-compatible format for LM Studio, Ollama, etc.
                    requestBody = {
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a job application AI assistant. Answer questions based on the provided user profile.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: 200
                    };
                }

                const endpoint = provider === 'gemini'
                    ? `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`
                    : `${apiUrl}/v1/chat/completions`;

                response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestBody)
                });

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Apply failed response:', response.status, errorText);
                const error = new Error(`Apply failed with status: ${response.status}`);
                (error as any).status = response.status;
                throw error;
            }

                const data = await response.json();
                let aiResponse;

                if (provider === 'gemini') {
                    aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
                } else {
                    aiResponse = data.choices?.[0]?.message?.content;
                }

                if (aiResponse) {
                    let answer = aiResponse.trim();
                    // Basic cleanup for keys
                    answer = answer.replace(/['"]/g, '');
                    answers[question.questionId] = answer;
                } else {
                    throw new Error('No response from AI');
                }

            } catch (error) {
                console.error(`Failed to answer question ${question.questionId}`, error);
                // Provide fallback answer based on question type
                answers[question.questionId] = this.getFallbackAnswer(question);
            }
        }

        return answers;
    }

    private getFallbackAnswer(question: any): any {
        switch (question.questionType) {
            case 'List Menu':
            case 'Radio':
                const options = question.answerOption;
                if (options && Object.keys(options).length > 0) {
                    return Object.keys(options)[0]; // Return first option key
                }
                return '1';
            case 'Check Box':
                return []; // Empty array for checkboxes
            case 'Text':
            default:
                return 'Experienced professional with strong technical skills.';
        }
    }
}
