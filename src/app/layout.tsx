import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Archivo } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import OnboardingCheck from "@/components/OnboardingCheck";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Applytron - Your Job Search on Autopilot",
  description:
    "Applytron auto-applies to jobs for you — AI-tailored resumes, automatic applications, and smart follow-ups so you never miss an opportunity.",
  keywords: "job search, AI, career, automation, resume, applications, auto-apply",
  authors: [{ name: "Applytron" }],
  openGraph: {
    title: "Applytron - Your Job Search on Autopilot",
    description:
      "Applytron auto-applies to jobs for you — AI-tailored resumes, automatic applications, and smart follow-ups.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${archivo.variable} ${jetbrainsMono.variable} antialiased bg-[var(--bg-deep)] text-[var(--text-main)] min-h-screen flex flex-col overflow-x-hidden`}
      >
        <Providers>
          <OnboardingCheck />
          <main className="flex-grow relative z-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
