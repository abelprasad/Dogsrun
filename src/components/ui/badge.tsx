import type { ReactNode } from "react";

// Status color recipes (same palette as the former status-badge).
const statusColors: Record<string, string> = {
  available: "bg-[#dbe7d6] text-[#2f5d3a] border border-[#2f5d3a]/20",
  placed: "bg-[#dbe7d6] text-[#2f5d3a] border border-[#2f5d3a]/20",
  adopted: "bg-[#dbe7d6] text-[#2f5d3a] border border-[#2f5d3a]/20",
  urgent: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-[#f4b942]/25 text-[#13241d] border border-[#f4b942]/40",
  rescue_requested: "bg-[#13241d] text-[#f4b942] border border-[#f4b942]/30",
  deceased: "bg-[#efe7dc] text-[#5d6a64] border border-[#13241d]/10",
  transferred: "bg-[#efe7dc] text-[#5d6a64] border border-[#13241d]/10",
  pastDue: "bg-red-600 text-white font-black",
  critical: "bg-red-100 text-red-700 border border-red-200 font-black",
  atRisk: "bg-[#13241d] text-[#f4b942] border border-[#f4b942]/30 font-black",
};

export type BadgeVariant = keyof typeof statusColors | "eyebrow";

const base =
  "inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider";

// The bordered gold eyebrow strip used on public page heroes.
const eyebrowClasses =
  "inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

export default function Badge({ variant = "available", className, children }: BadgeProps) {
  const classes =
    variant === "eyebrow"
      ? eyebrowClasses
      : `${base} ${statusColors[variant] ?? statusColors.available}`;
  return <span className={className ? `${classes} ${className}` : classes}>{children}</span>;
}

// Status labels for dog statuses, kept next to their colors.
export const statusLabels: Record<string, string> = {
  available: "Available",
  urgent: "Urgent",
  pending: "Pending",
  rescue_requested: "Rescue Requested",
  placed: "Placed",
  adopted: "Adopted",
  deceased: "Deceased",
  transferred: "Transferred",
};
