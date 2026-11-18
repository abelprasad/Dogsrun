"use client";

import { useSyncExternalStore } from "react";
import Badge from "@/components/ui/badge";
import { dogStatusLabel, getRiskLevel, VALID_DOG_STATUSES, type DogStatus } from '@/lib/dog-status';

interface StatusBadgeProps {
  status: string;
  euthanasiaDate?: string | null;
}

// Unrecognised statuses render with the neutral "available" styling.
function toDogStatus(status: string): DogStatus {
  return VALID_DOG_STATUSES.has(status) ? (status as DogStatus) : 'available';
}

// No-op subscribe: the snapshot never changes on its own; hydration flips it.
const subscribeNoop = () => () => {};

export default function StatusBadge({ status, euthanasiaDate }: StatusBadgeProps) {
  // M-F9: gate time-sensitive render on mount to avoid hydration mismatch.
  // useSyncExternalStore (false on the server, true after hydration) replaces
  // the old useEffect(() => setMounted(true)) pattern, which CI's
  // react-hooks/set-state-in-effect rule now rejects as an error.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!mounted) {
    return <Badge variant={toDogStatus(status)}>{dogStatusLabel(status)}</Badge>;
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
    <Badge variant={toDogStatus(status)}>{dogStatusLabel(status)}</Badge>
  );
}
