# Naukri Automation API Documentation

This document details the **real Naukri.com APIs** used by the automation tool, with complete flow explanations including questionnaire handling and AI integration.

## Disclaimer
These are direct calls to Naukri.com. Use responsibly; respect terms of service. Authentication requires login tokens.

## Authentication Flow
1. **Login:** Get `authorization` Bearer token and session cookies.
2. **Use Tokens:** Include in all subsequent requests.

## Complete Job Application Flow

### 1. Login
**API:** `POST https://www.naukri.com/central-login-services/v1/login`

**Request:**
```json
{"username": "your-email", "password": "your-password"}
```

**Curl:**
```bash
curl -X POST https://www.naukri.com/central-login-services/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username": "email", "password": "pass"}'
```

**Sample Response:**
```json
{
  "status": "success",
  "authorization": "Bearer eyJraWQiOiIzIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1veGlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwgTGlrZSBHZWNrbykgQ2hyb21lLzEyNC4wLjAuMCBTYWZhcmkvNTM3LjM2IEVkZy8xMjQuMC4wLjAiLCJpYXQiOjE3MzQ1MzQ2ODIsImV4cCI6MTczNDUzODI4Mn0.XYZ",
  "user": {
    "id": "SOME_ID",
    "name": "User Name"
  }
}
```

### 2. Search Jobs
**API:** `GET https://www.naukri.com/jobapi/v3/search?...`

**Logic:**
- Searches jobs by keywords, location, experience, salary filters.
- Returns paginated results (20 jobs/page).

**Curl:**
```bash
curl "https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_key_loc&searchType=adv&location=pune&keyword=react&pageNo=1&experience=3&ctcFilter=6to10" \
  -H "accept: application/json" \
  -H "authorization: Bearer {TOKEN}" \
  -H "cookie: nauk_at={TOKEN}; ..."
```

**Sample Response:**
```json
{
  "jobDetails": [
    {
      "jobId": "010425009123",
      "title": "React Developer",
      "companyName": "Tech Corp Pvt Ltd",
      "locations": ["Pune", "Mumbai"],
      "minSalary": 600000,
      "maxSalary": 1200000,
      "experience": "3-5 years",
      "tagsAndSkills": "React.js, JavaScript, HTML, CSS",
      "jobDescription": "We are looking for a skilled React Developer...",
      "applyCount": 45,
      "jobType": "Permanent",
      "postedDate": "2025-12-17"
    },
    {
      "jobId": "010425008456",
      "title": "Frontend Engineer",
      "companyName": "Innovate Solutions",
      "locations": ["Bengaluru"],
      "minSalary": 800000,
      "maxSalary": 1500000,
      "experience": "2-4 years",
      "tagsAndSkills": "React, TypeScript, Node.js",
      "jobDescription": "Join our team as a Frontend Engineer...",
      "applyCount": 23,
      "jobType": "Permanent",
      "postedDate": "2025-12-16"
    }
  ]
}
```

### 3. Get Job Details (Optional)
**API:** `GET https://www.naukri.com/jobapi/v4/job/{JOB_ID}`

**Logic:** Fetches full description, match score for suitability check.

**Curl:**
```bash
curl "https://www.naukri.com/jobapi/v4/job/12345?microsite=y" \
  -H "accept: application/json" \
  -H "authorization: Bearer {TOKEN}" \
  -H "cookie: nauk_at={TOKEN}; ..."
```

### 4. Initial Apply Attempt
**API:** `POST https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply`

**Logic:**
- Attempts to apply without answers.
- If status 200: Success.
- If not: Server returns questionnaire.

**Body (No Questions):**
```json
{
  "strJobsarr": ["12345"],
  "logstr": "--drecomm_profile-2-F-0-1--...",
  "flowtype": "show",
  "crossdomain": true,
  "jquery": 1,
  "rdxMsgId": "",
  "chatBotSDK": true,
  "mandatory_skills": ["React"],
  "optional_skills": ["Node"],
  "applyTypeId": "107",
  "closebtn": "y",
  "applySrc": "drecomm_profile",
  "sid": "12345",
  "mid": ""
}
```

**Curl (Initial Attempt):**
```bash
curl -X POST https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer {TOKEN}" \
  -H "cookie: nauk_at={TOKEN}; ..." \
  -d '{"strJobsarr": ["12345"], "logstr": "--drecomm_profile-2-F-0-1--...", "flowtype": "show", "crossdomain": true, "jquery": 1, "rdxMsgId": "", "chatBotSDK": true, "mandatory_skills": ["React"], "optional_skills": ["Node"], "applyTypeId": "107", "closebtn": "y", "applySrc": "drecomm_profile", "sid": "12345", "mid": ""}'
```

**Sample Response (Failure with Questions):**
```json
{
  "jobs": [
    {
      "jobId": "12345",
      "status": 400,
      "questionnaire": [
        {
          "questionId": "q1",
          "questionName": "Years of Experience?",
          "questionType": "List Menu",
          "answerOption": {
            "1": "0-1 year",
            "2": "1-2 years",
            "3": "2-3 years",
            "4": "3-5 years"
          }
        },
        {
          "questionId": "q2",
          "questionName": "Skills?",
          "questionType": "Check Box",
          "answerOption": {
            "1": "React",
            "2": "Node.js",
            "3": "Python"
          }
        }
      ]
    }
  ]
}
```

### 5. Questionnaire Handling
**Logic (If Initial Apply Fails):**
- Parse `response.jobs[0].questionnaire` for questions.
- Questions types: Text, Radio, Checkbox, List.
- Check cached answers in `questions.json` (by unique ID).
- For new questions:
  - **AI Mode:** Call Gemini API to generate answers.
  - **Manual Mode:** Prompt user.

**AI Call (Internal):**
- Prompt: "Answer this job question based on profile..."
- API: Google GenAI (via `@google/genai`).
- Confidence check (>40% to accept).

### 6. Retry Apply with Answers
**API:** Same POST endpoint.

**Logic:**
- Include `applyData` with question answers.
- Format: `{"questionId": "answer"}` or array for multiples.

**Body (With Answers):**
```json
{
  "strJobsarr": ["12345"],
  "applyData": {
    "q1": "5 years",
    "q2": ["React", "Node"]
  },
  ... (same as initial)
}
```

**Curl (With Answers):**
```bash
curl -X POST https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer {TOKEN}" \
  -H "cookie: nauk_at={TOKEN}; ..." \
  -d '{"strJobsarr": ["12345"], "applyData": {"q1": "3-5 years", "q2": ["React", "Node.js"]}, "logstr": "--drecomm_profile-2-F-0-1--...", "flowtype": "show", "crossdomain": true, "jquery": 1, "rdxMsgId": "", "chatBotSDK": true, "mandatory_skills": ["React"], "optional_skills": ["Node"], "applyTypeId": "107", "closebtn": "y", "applySrc": "drecomm_profile", "sid": "12345", "mid": ""}'
```

**Sample Response (Success):**
```json
{
  "jobs": [
    {
      "jobId": "12345",
      "status": 200,
      "message": "Applied successfully"
    }
  ],
  "quotaDetails": {
    "dailyApplied": 5,
    "dailyLimit": 50
  }
}
```

## AI Integration Details
- **SDK:** `@google/genai` (new Google GenAI).
- **Model:** `gemini-3-flash` (default, fast and intelligent).
- **Prompt Engineering:** Semantic matching for job suitability.
- **Fallback:** Manual input if AI fails.

## Error Handling
- 401: Re-login.
- 403: Rate limited.
- "Already applied": Skip.
- JSON parse errors: Log and continue.

## Full Workflow Summary
1. Login → Get tokens.
2. Search → Get job IDs.
3. Details (optional) → Get descriptions.
4. Apply → Check for questions.
5. Handle questions (AI/Manual) → Generate answers.
6. Re-apply with answers → Success.

This covers the end-to-end automation logic.
http://localhost:3000
```

## Authentication
The API uses session-based auth. Run the CLI first to log in, then start the web server.

## Endpoints

### 1. Fetch Jobs
Fetch jobs based on pages.

**Endpoint:** `POST /api/search`

**Request:**
```json
{
  "pages": 5
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"pages": 5}'
```

**Response:** Success message if jobs are fetched and saved.

### 2. Get Fetched Jobs
Retrieve the list of fetched jobs.

**Endpoint:** `GET /api/jobs`

**Curl Example:**
```bash
curl http://localhost:3000/api/jobs
```

**Response:**
```json
{
  "fetched": [
    {
      "jobId": "12345",
      "title": "Software Engineer",
      "company": "Example Corp",
      "salary": "₹5-10 LPA",
      "matchScore": 85,
      "applied": false
    }
  ],
  "filtered": [...]
}
```

### 3. Apply to a Job
Apply to a specific job by ID.

**Endpoint:** `POST /api/jobs/apply`

**Request:**
```json
{
  "jobId": "12345"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:3000/api/jobs/apply \
  -H "Content-Type: application/json" \
  -d '{"jobId": "12345"}'
```

**Response:**
```json
{
  "message": "Applied successfully"
}
```

### 4. Fetch and Apply Jobs
Fetch unapplied jobs from saved list and apply to a specified number.

**Endpoint:** `POST /api/fetch-apply`

**Request:** (No body needed, applies to available unapplied jobs)

**Curl Example:**
```bash
curl -X POST http://localhost:3000/api/fetch-apply
```

**Response:**
```json
{
  "message": "Fetch and apply completed"
}
```

### 5. Get Analytics
Retrieve usage statistics.

**Endpoint:** `GET /api/analytics`

**Curl Example:**
```bash
curl http://localhost:3000/api/analytics
```

**Response:**
```json
{
  "totalFetched": 10,
  "totalApplied": 5,
  "successRate": "50%",
  "labels": ["Day 1", "Day 2"],
  "appliedData": [2, 3]
}
```

### 6. Configure Preferences
Update preferences like pages and quota.

**Endpoint:** `POST /api/configure`

**Request:**
```json
{
  "pages": 10,
  "quota": 40
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:3000/api/configure \
  -H "Content-Type: application/json" \
  -d '{"pages": 10, "quota": 40}'
```

### 7. Test AI
Test AI prompts.

**Endpoint:** `POST /api/test-ai`

**Request:**
```json
{
  "prompt": "Explain quantum computing"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:3000/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing"}'
```

**Response:**
```json
{
  "result": "AI-generated response here"
}
```

## Naukri.com Direct API Calls

These are the actual APIs the tool uses to interact with Naukri.com. Replace `{AUTH_TOKEN}` with your Bearer token and `{COOKIE}` with session cookies.

### 1. Login
**Endpoint:** `POST https://www.naukri.com/central-login-services/v1/login`

**Request:**
```json
{
  "username": "your-email",
  "password": "your-password"
}
```

**Curl Example:**
```bash
curl -X POST https://www.naukri.com/central-login-services/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your-email", "password": "your-password"}'
```

### 2. Search Jobs
**Endpoint:** `GET https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_key_loc&searchType=adv&location=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&keyword={KEYWORDS}&sort=p&pageNo={PAGE}&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&k={KEYWORDS}&l=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&nignbevent_src=jobsearchDeskGNB&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&src=cluster&latLong=18.7506117_73.8764436&sid=17143714288347830_8`

**Headers:**
```
accept: application/json
authorization: Bearer {AUTH_TOKEN}
cookie: nauk_at={AUTH_TOKEN}; {OTHER_COOKIES}
```

**Curl Example:**
```bash
curl "https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_key_loc&searchType=adv&location=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&keyword=react&sort=p&pageNo=1&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&k=react&l=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&nignbevent_src=jobsearchDeskGNB&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&src=cluster&latLong=18.7506117_73.8764436&sid=17143714288347830_8" \
  -H "accept: application/json" \
  -H "authorization: Bearer {AUTH_TOKEN}" \
  -H "cookie: nauk_at={AUTH_TOKEN}; {OTHER_COOKIES}"
```

### 3. Get Job Details
**Endpoint:** `GET https://www.naukri.com/jobapi/v4/job/{JOB_ID}?microsite=y&src=jobsearchDesk&sid=17563633043679150&xp=1&px=1`

**Headers:** Same as search.

**Curl Example:**
```bash
curl "https://www.naukri.com/jobapi/v4/job/12345?microsite=y&src=jobsearchDesk&sid=17563633043679150&xp=1&px=1" \
  -H "accept: application/json" \
  -H "authorization: Bearer {AUTH_TOKEN}" \
  -H "cookie: nauk_at={AUTH_TOKEN}; {OTHER_COOKIES}"
```

### 4. Apply to Job
**Endpoint:** `POST https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply`

**Body:** Complex JSON with job IDs and answers.

**Curl Example:**
```bash
curl -X POST https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer {AUTH_TOKEN}" \
  -H "cookie: nauk_at={AUTH_TOKEN}; {OTHER_COOKIES}" \
  -d '{"strJobsarr":["12345"],"applyData":{},"logstr":"--drecomm_profile-2-F-0-1--17140801091455348-","flowtype":"show","crossdomain":true,"jquery":1,"rdxMsgId":"","chatBotSDK":true,"mandatory_skills":["CSS","HTML","React.Js"],"optional_skills":["Typescript","Angular"],"applyTypeId":"107","closebtn":"y","applySrc":"drecomm_profile","sid":"17140801091455348","mid":""}'
```

## Notes
- Start the server with `npm run web`.
- All endpoints require the user to be logged in via CLI.
- Error responses include status codes and messages.
- Naukri APIs may change; use at your own risk.