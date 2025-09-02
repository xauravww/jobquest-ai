"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinkClasses =
    "relative text-gray-300 hover:text-primary transition-colors duration-300 font-medium after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:scale-x-0 after:bg-primary after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100";

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ease-in-out ${isScrolled
        ? "bg-bg-dark/95 backdrop-blur-md shadow-xl border-b border-border"
        : "bg-bg-dark/90 backdrop-blur-sm"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main container controlling alignment and height */}
        <div
          className={`flex items-center justify-between transition-all duration-300 ease-in-out h-20`}
        >
          {/* Left Section (Logo) */}
          <div className="flex-1 md:flex-none">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <span className="text-2xl font-bold text-white">Jobquest AI</span>
            </Link>
          </div>

          {/* Center Section (Desktop Menu) */}
          <div className="hidden md:flex flex-1 justify-center space-x-8">
            <Link href="/" className={navLinkClasses}>
              Features
            </Link>
            <Link href="/pricing" className={navLinkClasses}>
              Pricing
            </Link>
            <Link href="/about" className={navLinkClasses}>
              About
            </Link>
            <Link href="/contact" className={navLinkClasses}>
              Contact
            </Link>
          </div>

          {/* Right Section (Auth Buttons & Mobile Menu Button) */}
          <div className="flex flex-1 md:flex-none justify-end items-center gap-4">
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 font-medium"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="button-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-bg-card border border-border text-white hover:bg-bg-light transition-colors"
                aria-label="Toggle menu"
              >
                <FiMenu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden absolute top-0 left-0 w-full bg-slate-900/95 backdrop-blur-sm transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "transform translate-y-0" : "transform -translate-y-full"
          }`}
      >
        <button
          onClick={toggleMobileMenu}
          aria-label="Close mobile menu"
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition z-50"
        >
          <FiX className="w-6 h-6 text-white" />
        </button>
        <div className="flex flex-col items-center justify-center space-y-8 h-screen">
          <Link href="/" className="text-2xl text-white font-medium" onClick={toggleMobileMenu}>
            Features
          </Link>
          <Link href="/pricing" className="text-2xl text-white font-medium" onClick={toggleMobileMenu}>
            Pricing
          </Link>
          <Link href="/about" className="text-2xl text-white font-medium" onClick={toggleMobileMenu}>
            About
          </Link>
          <Link href="/contact" className="text-2xl text-white font-medium" onClick={toggleMobileMenu}>
            Contact
          </Link>
          <div className="flex flex-col gap-4 mt-8">
            {session ? (
              <>
                <Link href="/dashboard" className="text-xl text-gray-300" onClick={toggleMobileMenu}>
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    toggleMobileMenu();
                  }}
                  className="flex items-center justify-center gap-2 text-xl text-gray-300"
                >
                  <FiLogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="text-xl text-gray-300" onClick={toggleMobileMenu}>
                  Sign In
                </Link>
                <Link href="/auth/signup" className="button-primary text-lg" onClick={toggleMobileMenu}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}