import React from "react";

export default function Footer() {
  return (
    <footer className="bg-bg-dark bg-opacity-90 text-text-muted py-16 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex flex-col space-y-4 max-w-sm">
          <h2 className="text-2xl font-bold">Jobquest AI</h2>
          <p className="text-primary-foreground/80">
            Find your dream job faster with AI-powered job matching, automated applications, and personalized career insights.
          </p>
          <p className="text-sm select-none">&copy; {new Date().getFullYear()} Jobquest AI. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap justify-start gap-10 text-sm flex-grow">
          <div className="flex flex-col space-y-2 min-w-[120px]">
            <h3 className="font-semibold text-primary-foreground mb-2">Company</h3>
            <a href="/about" className="hover:text-highlight transition font-medium">
              About
            </a>
            <a href="/privacy" className="hover:text-highlight transition font-medium">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-highlight transition font-medium">
              Terms of Service
            </a>
            <a href="/contact" className="hover:text-highlight transition font-medium">
              Contact
            </a>
          </div>
          <div className="flex flex-col space-y-2 min-w-[120px]">
            <h3 className="font-semibold text-primary-foreground mb-2">Resources</h3>
            <a href="/blog" className="hover:text-highlight transition font-medium">
              Blog
            </a>
            <a href="/help" className="hover:text-highlight transition font-medium">
              Help Center
            </a>
            <a href="/careers" className="hover:text-highlight transition font-medium">
              Careers
            </a>
          </div>
          <div className="flex flex-col space-y-2 min-w-[120px]">
            <h3 className="font-semibold text-primary-foreground mb-2">Connect</h3>
            <a href="https://twitter.com/jobquestai" target="_blank" rel="noopener noreferrer" className="hover:text-highlight transition font-medium">
              Twitter
            </a>
            <a href="https://linkedin.com/company/jobquestai" target="_blank" rel="noopener noreferrer" className="hover:text-highlight transition font-medium">
              LinkedIn
            </a>
            <a href="mailto:support@jobquestai.com" className="hover:text-highlight transition font-medium">
              Email Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
