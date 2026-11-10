import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { nav } from "@/components/landing/content";

type PrimaryCtaProps = {
  href?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
};

// The single main action, reused verbatim across nav, hero and close.
const PrimaryCta = ({
  href = "/auth/signup",
  label = nav.cta,
  size = "md",
  className,
  onClick,
}: PrimaryCtaProps) => (
  <Link href={href} onClick={onClick}>
    <Button size={size} className={className} rightIcon={<span aria-hidden>→</span>}>
      {label}
    </Button>
  </Link>
);

export default PrimaryCta;
