"use client";

import { useEffect, useState } from "react";
import Badge, { type BadgeVariant } from "@/components/ui/badge";
import { dogStatusLabel, getRiskLevel } from '@/lib/dog-status';

// Kept for existing importers; the status prop accepts any string.
export type DogStatus = string;

interface StatusBadgeProps {
  status: string;
  euthanasiaDate?: string | null;
}

export default function StatusBadge({ status, euthanasiaDate }: StatusBadgeProps) {
  // M-F9: gate time-sensitive render on mount to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <Badge variant={status as BadgeVariant}>{dogStatusLabel(status)}</Badge>;
  }
  // Euthanasia date overrides status color
  if (euthanasiaDate) {
    const risk = getRiskLevel(euthanasiaDate);

    if (risk === 'past-due') {
      return <Badge variant="pastDue">Past Due</Badge>;
    }
    if (risk === 'critical') {
      return <Badge variant="critical">Critical</Badge>;
    }
    return <Badge variant="atRisk">At Risk</Badge>;
  }

  return (
    <Badge variant={status as BadgeVariant}>{dogStatusLabel(status)}</Badge>
  );
}
