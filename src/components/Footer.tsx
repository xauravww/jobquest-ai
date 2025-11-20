import React from "react";
import { Twitter, Linkedin, Mail, Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JQ</span>
              </div>
              <h2 className="text-xl font-bold text-white">Jobquest AI</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Revolutionizing job search with AI-powered matching, automated applications, and personalized career insights.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a
                href="https://linkedin.com/company/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                aria-label="Connect on LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a
                href="https://github.com/jobquestai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                aria-label="View our GitHub"
              >
                <Github className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a
                href="mailto:support@jobquestai.com"
                className="w-10 h-10 bg-slate-800 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                aria-label="Email us"
              >
                <Mail className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/ai-filtering" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  AI Filtering
                </a>
              </li>
              <li>
                <a href="/application-tracking" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
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
                <a href="/about" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="/blog" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="/careers" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Careers
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
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
                <a href="/help" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/status" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  System Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest updates on new features and job search tips.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <button className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Jobquest AI. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for job seekers worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
