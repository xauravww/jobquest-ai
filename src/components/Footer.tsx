import React from "react";
import { Twitter, Linkedin, Mail, Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-slate-900 border-t border-white/10 overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-500/10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white tracking-tight">JobQuest</h2>
                <span className="text-sm font-semibold text-emerald-400 tracking-wider uppercase">AI Powered</span>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Revolutionizing job search with AI-powered matching, automated applications, and personalized career insights.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
              </a>
              <a
                href="https://linkedin.com/company/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="Connect on LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
              </a>
              <a
                href="https://github.com/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="View our GitHub"
              >
                <Github className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
              </a>
              <a
                href="mailto:support@jobquestai.com"
                className="w-12 h-12 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
                aria-label="Email us"
              >
                <Mail className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/ai-filtering" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  AI Filtering
                </a>
              </li>
              <li>
                <a href="/application-tracking" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Application Tracking
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="/blog" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="/careers" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Careers
                </a>
              </li>
              <li>
                <a href="/contact" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="/help" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/status" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  System Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
            <p className="text-slate-300 text-sm mb-6">
              Get the latest updates on new features and job search tips.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm backdrop-blur-sm"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 font-medium text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} JobQuest AI. All rights reserved.
            </p>
            <p className="text-slate-400 text-sm flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for job seekers worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
