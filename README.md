# Jobquest AI

Jobquest AI is an intelligent career co-pilot designed to accelerate your job search by leveraging AI-powered job filtering, unified application tracking, resume optimization, and automated calendar reminders. Built with modern web technologies, Jobquest AI helps job seekers focus on acing interviews while automating the tedious parts of the job hunt.

---

## Key Features

- **AI-Powered Job Filtering:** Uses advanced AI to analyze job listings, filter out spam, and surface genuine hiring posts tailored to your profile.
- **Unified Application Tracking:** Manage your entire job application pipeline from saved jobs to offers, with notes and reminders.
- **Resume & ATS Optimization:** Upload multiple resume versions and get ATS scoring to optimize your chances.
- **Automated Calendar & Reminders:** Automatically schedule interviews and follow-ups with integrated calendar and reminder support.
- **Dashboard Analytics:** Visualize your job search performance with data-driven insights.
- **Multiple AI Providers Supported:** Configure AI providers such as LM Studio, Ollama, and Google Gemini for job filtering and analysis.
- **Authentication & User Onboarding:** Secure user authentication with NextAuth and onboarding flows.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS, Radix UI, Lucide Icons
- **Database:** MongoDB with Mongoose and Prisma ORM
- **Authentication:** NextAuth.js
- **AI Integration:** Local and cloud AI providers (LM Studio, Ollama, Gemini)
- **Testing:** Jest, React Testing Library
- **Other Libraries:** Ant Design, Framer Motion, React Hot Toast, Recharts, Swiper

---

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- MongoDB instance (local or cloud)
- AI provider setup (optional, see AI Configuration)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/jobquest-ai.git
cd jobquest-ai
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory and add the following environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Search API Configuration (Canine Search API)
SEARCH_API_URL=

# Job Search Server Configuration (Now integrated in Next.js)
#

# AI Server Configuration (Local LM Studio or similar)
AI_SERVER_URL=http://localhost:1234
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## Usage

- Use the AI-powered job search page to find relevant job listings with intelligent filtering.
- Track jobs you are interested in and skip irrelevant ones.
- Manage your applications, resumes, and calendar reminders from the dashboard.
- Configure AI providers in the AI Config panel for customized filtering.

---

## API Endpoints Overview

- `/api/jobs/search` - Search jobs with query and filters.
- `/api/jobs/filter` - Filter job results using AI and user-defined criteria.
- `/api/applications` - Manage tracked job applications.
- `/api/resumes` - Upload, download, duplicate, and manage resumes.
- `/api/calendar/events` - Manage calendar events and interview schedules.
- `/api/reminders` - Manage reminders for applications and interviews.
- `/api/auth` - Authentication routes powered by NextAuth.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a pull request describing your changes.

Please ensure your code follows the existing style and passes all tests.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [Radix UI](https://www.radix-ui.com/) and [Lucide Icons](https://lucide.dev/)
- AI integration inspired by local and cloud AI providers

---

## Contact

For questions or support, please open an issue or contact the maintainer.
