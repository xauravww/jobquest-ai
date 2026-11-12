import React from "react";
import { Twitter, Linkedin, Mail, Github, Heart } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--border-glass)] overflow-hidden" style={{ backgroundColor: 'var(--footer-bg)' }}>
      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[var(--footer-accent)] rounded-2xl flex items-center justify-center">
                <span className="text-[var(--bg-deep)] font-bold text-lg">J</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">JobQuest</h2>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">
              Tailored resumes, automatic applications, and timely follow-ups.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--bg-glass)] hover:bg-[var(--footer-accent)]/20 border border-[var(--border-glass)] hover:border-[var(--footer-accent)]/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--footer-accent)]" />
              </a>
              <a
                href="https://linkedin.com/company/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--bg-glass)] hover:bg-[var(--footer-accent)]/20 border border-[var(--border-glass)] hover:border-[var(--footer-accent)]/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="Connect on LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--footer-accent)]" />
              </a>
              <a
                href="https://github.com/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--bg-glass)] hover:bg-[var(--footer-accent)]/20 border border-[var(--border-glass)] hover:border-[var(--footer-accent)]/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="View our GitHub"
              >
                <Github className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--footer-accent)]" />
              </a>
              <a
                href="mailto:support@jobquestai.com"
                className="w-12 h-12 bg-[var(--bg-glass)] hover:bg-[var(--footer-accent)]/20 border border-[var(--border-glass)] hover:border-[var(--footer-accent)]/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="Email us"
              >
                <Mail className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--footer-accent)]" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-[var(--text-main)] font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
               <li>
                 <a href="#features" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Features
                 </a>
               </li>
               <li>
                 <a href="#pricing" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Pricing
                 </a>
               </li>
               <li>
                 <a href="/ai-filtering" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   AI Filtering
                 </a>
               </li>
               <li>
                 <a href="/application-tracking" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Application Tracking
                 </a>
               </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-[var(--text-main)] font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
               <li>
                 <a href="/about" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   About Us
                 </a>
               </li>
               <li>
                 <a href="/blog" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Blog
                 </a>
               </li>
               <li>
                 <a href="/careers" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Careers
                 </a>
               </li>
               <li>
                 <a href="/contact" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Contact
                 </a>
               </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-[var(--text-main)] font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
               <li>
                 <a href="/help" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Help Center
                 </a>
               </li>
               <li>
                 <a href="/privacy" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Privacy Policy
                 </a>
               </li>
               <li>
                 <a href="/terms" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   Terms of Service
                 </a>
               </li>
               <li>
                 <a href="/status" className="text-[var(--text-muted)] hover:text-[var(--footer-accent)] transition-colors text-sm">
                   System Status
                 </a>
               </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-[var(--border-glass)]">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-[var(--text-main)] font-semibold mb-2">Stay Updated</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Get the latest updates on new features and job search tips.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--footer-accent)] focus:border-transparent text-sm backdrop-blur-sm"
              />
              <Button variant="primary" className="px-6 py-3">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-[var(--border-glass)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[var(--text-muted)] text-sm">
              &copy; {new Date().getFullYear()} JobQuest AI. All rights reserved.
            </p>
            <p className="text-[var(--text-muted)] text-sm flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for job seekers worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
