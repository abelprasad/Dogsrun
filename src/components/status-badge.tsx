import Badge, { statusLabels, type BadgeVariant } from "@/components/ui/badge";

// Kept for existing importers; the status prop accepts any string.
export type DogStatus = string;

interface StatusBadgeProps {
  status: string;
  euthanasiaDate?: string | null;
}

export default function StatusBadge({ status, euthanasiaDate }: StatusBadgeProps) {
  // Euthanasia date overrides status color
  if (euthanasiaDate) {
    const now = new Date();
    const target = new Date(euthanasiaDate);
    const diffHours = (target.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return <Badge variant="pastDue">Past Due</Badge>;
    }
    if (diffHours <= 24) {
      return <Badge variant="critical">Critical</Badge>;
    }
    return <Badge variant="atRisk">At Risk</Badge>;
  }

  return (
    <Badge variant={status as BadgeVariant}>{statusLabels[status] || status}</Badge>
  );
}
