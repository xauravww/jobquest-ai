import { CheckCircle2, Clock, FileText, Send, TrendingUp } from "lucide-react";

// Data-driven icon lookup for landing copy. Keys in content.ts map here.
export const ICONS = {
  file: FileText,
  send: Send,
  chart: TrendingUp,
  clock: Clock,
  check: CheckCircle2,
} as const;

export type IconKey = keyof typeof ICONS;
