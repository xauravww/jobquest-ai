import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import AppFrame from "@/components/landing/AppFrame";
import Features from "@/components/landing/Features";
import PipelineDiagram from "@/components/landing/PipelineDiagram";
import WordHighlight from "@/components/landing/WordHighlight";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)]">
      <Navbar />
      <Hero />
      <AppFrame />
      <Features />
      <PipelineDiagram />
      <WordHighlight />
      <Faq />
      <Footer />
    </div>
  );
}
