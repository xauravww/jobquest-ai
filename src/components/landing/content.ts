// Centralized copy for the Applytron landing experience.
// All visible text lives here; components render it.
import type { IconKey } from "./icons";

export const nav = {
  words: [
    { name: "How it works", href: "#app-frame" },
    { name: "Features", href: "#features" },
    { name: "Questions", href: "#questions" },
  ],
  signIn: "Sign in",
  cta: "Start automating",
};

export const hero = {
  h1: "Job application automation for people who’d rather interview.",
  sub:
    "Upload your resume once. Applytron tailors it to each role, submits the application on Naukri, and follows up while you keep interviewing.",
  primaryCta: "Start automating",
  secondaryCta: "See how it works",
  secondaryHref: "#app-frame",
};

export type AppStatus = "t" | "a" | "f";

export const appFrame = {
  heading: "Every application, tracked in one window",
  intro:
    "Queue the roles you want. Applytron tailors a resume for each one, applies on Naukri, and logs every reply, so a week of searching reads as a single list.",
  windowLabel:
    "The Applytron applications window: a list of applications beside the open application's progress",
  listLabel: "Applications",
  rows: [
    { co: "Veyra", role: "Product Designer", status: "f" as AppStatus, sub: "Follow-up sent" },
    { co: "Arc Systems", role: "Frontend Engineer", status: "a" as AppStatus, sub: "Applied 2h ago" },
    { co: "Marble & Co", role: "Brand Designer", status: "t" as AppStatus, sub: "Resume tailored" },
    { co: "Far Point", role: "Staff Engineer", status: "a" as AppStatus, sub: "Applied 1d ago" },
    { co: "Kinfolk Labs", role: "UX Engineer", status: "t" as AppStatus, sub: "Resume tailored" },
    { co: "Osprey", role: "Design Lead", status: "a" as AppStatus, sub: "Applied 3d ago" },
    { co: "Brightwell", role: "Product Owner", status: "f" as AppStatus, sub: "Reply received" },
  ],
  openRole: "Product Designer",
  openCompany: "Veyra · Remote",
  openStatus: "In progress",
  timeline: [
    { icon: "file" as IconKey, label: "Resume tailored to the role", done: true },
    { icon: "send" as IconKey, label: "Application submitted on Naukri", done: true },
    { icon: "clock" as IconKey, label: "Follow-up scheduled for day 5", done: true },
    { icon: "check" as IconKey, label: "Reply logged, next step queued", done: false },
  ],
  queue: "Queue: 42 applications waiting on your approval",
};

export const features = {
  heading: "Three steps, then hands-off",
  intro: "You set the search. Applytron runs it.",
  steps: [
    { n: "01", icon: "file" as IconKey, title: "Tailors your resume", body: "Reads each role and rewrites your base resume to match the skills and keywords it asks for." },
    { n: "02", icon: "send" as IconKey, title: "Applies for you", body: "Fills and submits each application on Naukri while you prep for interviews." },
    { n: "03", icon: "chart" as IconKey, title: "Follows up on time", body: "Nudges each application at the right moment, in your voice." },
  ],
};

export const pipeline = {
  heading: "How an application goes out",
  intro: "One search in, three parallel jobs out, all under your approval.",
  input: "Your resume + saved search",
  hub: "Applytron",
  tracker: "Your tracker",
  lanes: [
    { icon: "file" as IconKey, label: "Tailor", sub: "resume for the role" },
    { icon: "send" as IconKey, label: "Apply", sub: "on Naukri" },
    { icon: "chart" as IconKey, label: "Follow up", sub: "in your voice" },
  ],
};

export const moment = {
  heading: "Splitting the work",
  lead: "Applytron handles the",
  highlightA: "copy-paste",
  mid: ". You handle the",
  highlightB: " conversation",
  close: ".",
  sub: "Your approval stands between the two; nothing goes out without it.",
};

export const faq = {
  heading: "Questions",
  items: [
    { q: "How does the resume tailoring work?", a: "Applytron reads the role next to your base resume and rewrites your experience to surface the skills it asks for. You approve the result before it goes out." },
    { q: "Can I review applications before they are sent?", a: "Yes. Turn on approval and each application waits for your OK. Leave it off and Applytron runs the queue on its own." },
    { q: "Which job boards does it work with?", a: "Today it applies on Naukri. More boards are added as integrations land." },
    { q: "What happens to my data?", a: "Your resume and applications are encrypted, and only you can see them. Nothing is sold or shared." },
  ],
};

export const footer = {
  closeHeading: "Start your automated job search",
  closeIntro:
    "Point it at the roles you want. Let it apply, tailor, and follow up while you do the interviewing.",
  blurb: "AI job application automation for candidates applying on Naukri.",
  columns: [
    { title: "Product", links: [{ name: "How it works", href: "#app-frame" }, { name: "Features", href: "#features" }, { name: "Questions", href: "#questions" }] },
    { title: "Account", links: [{ name: "Sign in", href: "/auth/signin" }, { name: "Create account", href: "/auth/signup" }] },
    { title: "Plan", links: [{ name: "Start automating", href: "/auth/signup" }] },
  ],
  legal: (year: number) => `© ${year} Applytron. All rights reserved.`,
  disclaimer: "Applytron is not affiliated with Naukri.",
};
