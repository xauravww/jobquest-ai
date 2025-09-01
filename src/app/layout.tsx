import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jobquest AI - AI-Powered Job Search Platform",
  description: "Find your dream job faster with AI-powered job matching, automated applications, and personalized career insights.",
  keywords: "job search, AI, career, employment, resume, applications",
  authors: [{ name: "Jobquest AI Team" }],
  openGraph: {
    title: "Jobquest AI - AI-Powered Job Search Platform",
    description: "Find your dream job faster with AI-powered job matching, automated applications, and personalized career insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-text min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="pt-16 flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
