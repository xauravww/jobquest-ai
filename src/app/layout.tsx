import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers";
import OnboardingCheck from "@/components/OnboardingCheck";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jobquest AI - AI-Powered Job Search Platform",
  description:
    "Find your dream job faster with AI-powered job matching, automated applications, and personalized career insights.",
  keywords: "job search, AI, career, employment, resume, applications",
  authors: [{ name: "Jobquest AI Team" }],
  openGraph: {
    title: "Jobquest AI - AI-Powered Job Search Platform",
    description:
      "Find your dream job faster with AI-powered job matching, automated applications, and personalized career insights.",
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-bg text-text min-h-screen flex flex-col`}
      >
        <Providers>
          <OnboardingCheck />
          <Navbar />
          <main className="pt-16 flex-grow">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
