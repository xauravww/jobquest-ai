"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Dropdown, Avatar, type MenuProps } from "antd";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";
import BrandMark from "@/components/ui/BrandMark";
import PrimaryCta from "@/components/landing/PrimaryCta";
import { nav } from "@/components/landing/content";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="text-[15px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors relative group"
  >
    {children}
    <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--text-main)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
  </Link>
);

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const close = () => setOpen(false);
  const isAuthed = status === "authenticated";

  const userMenu: MenuProps["items"] = [
    {
      key: "dashboard",
      icon: <LayoutDashboard size={14} />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    { type: "divider" },
    {
      key: "signout",
      icon: <LogOut size={14} />,
      label: "Sign out",
      danger: true,
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[var(--bg-deep)] border-b border-[var(--border)]">
      <div className="mx-auto h-full max-w-[1280px] px-6 md:px-10 flex items-center justify-between">
        <BrandMark size={30} />

        {/* Desktop links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
          {nav.words.map((word) => (
            <NavLink key={word.name} href={word.href}>
              {word.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthed && session?.user ? (
            <Dropdown menu={{ items: userMenu }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full p-0.5 pr-2 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <Avatar
                  size={30}
                  src={session.user.image || undefined}
                  style={{ background: "var(--accent)", color: "#0e1116", fontWeight: 600 }}
                >
                  {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>
                {session.user.name && (
                  <span className="text-sm font-medium text-[var(--text-main)] hidden lg:inline">
                    {session.user.name.split(" ")[0]}
                  </span>
                )}
              </button>
            </Dropdown>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-[15px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                {nav.signIn}
              </Link>
              <PrimaryCta />
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <Button
          type="button"
          variant="ghost"
          className="md:hidden w-11 h-11 p-0"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Full-screen mobile sheet */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-0 top-[72px] bg-[var(--bg-deep)] px-6 py-10 flex flex-col z-40"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {nav.words.map((word) => (
              <Link
                key={word.name}
                href={word.href}
                onClick={close}
                className="py-4 text-2xl font-normal text-[var(--text-main)] border-b border-[var(--border)]"
              >
                {word.name}
              </Link>
            ))}
            {isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="py-4 text-2xl font-normal text-[var(--text-main)] border-b border-[var(--border)]"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="py-4 text-2xl font-normal text-left text-[var(--text-muted)] border-b border-[var(--border)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                onClick={close}
                className="py-4 text-2xl font-normal text-[var(--text-muted)] border-b border-[var(--border)]"
              >
                {nav.signIn}
              </Link>
            )}
          </nav>
          <div className="mt-auto">
            {isAuthed ? (
              <Button size="lg" className="w-full" onClick={() => router.push("/dashboard")}>
                Go to dashboard
              </Button>
            ) : (
              <PrimaryCta size="lg" className="w-full" onClick={close} />
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
