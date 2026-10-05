// REVIEW: the prop already accepts string; drop this type and the `as DogStatus` casts.
import { dogStatusLabel, getRiskLevel, type DogStatus } from '@/lib/dog-status';

interface StatusBadgeProps {
  status: DogStatus | string;
  euthanasiaDate?: string | null;
}

export default function StatusBadge({ status, euthanasiaDate }: StatusBadgeProps) {
  // Euthanasia date overrides status color
  if (euthanasiaDate) {
    const risk = getRiskLevel(euthanasiaDate);

    if (risk === 'past-due') {
      return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-red-600 text-white">Past Due</span>;
    }
    if (risk === 'critical') {
      return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">Critical</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-[#13241d] text-[#f4b942] border border-[#f4b942]/30">At Risk</span>;
  }

  const styles: Record<string, string> = {
    available: "bg-[#dbe7d6] text-[#2f5d3a] border border-[#2f5d3a]/20",
    urgent: "bg-red-100 text-red-700 border border-red-200",
    pending: "bg-[#f4b942]/25 text-[#13241d] border border-[#f4b942]/40",
    rescue_requested: "bg-[#13241d] text-[#f4b942] border border-[#f4b942]/30",
    placed: "bg-[#dbe7d6] text-[#2f5d3a] border border-[#2f5d3a]/20",
    adopted: "bg-[#dbe7d6] text-[#2f5d3a] border border-[#2f5d3a]/20",
    deceased: "bg-[#efe7dc] text-[#5d6a64] border border-[#13241d]/10",
    transferred: "bg-[#efe7dc] text-[#5d6a64] border border-[#13241d]/10",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[status] || styles.available}`}>
      {dogStatusLabel(status)}
    </span>
  );
}
