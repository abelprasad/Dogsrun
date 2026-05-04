export type DogStatus = 'available' | 'pending' | 'adopted' | 'deceased' | 'transferred' | 'urgent' | 'rescue_requested' | 'placed';

interface StatusBadgeProps {
  status: DogStatus | string;
  euthanasiaDate?: string | null;
}

export default function StatusBadge({ status, euthanasiaDate }: StatusBadgeProps) {
  // Euthanasia date overrides status color
  if (euthanasiaDate) {
    const now = new Date();
    const target = new Date(euthanasiaDate);
    const diffHours = (target.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-red-600 text-white">Past Due</span>;
    }
    if (diffHours <= 24) {
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

  const labels: Record<string, string> = {
    available: "Available",
    urgent: "Urgent",
    pending: "Pending",
    rescue_requested: "Rescue Requested",
    placed: "Placed",
    adopted: "Adopted",
    deceased: "Deceased",
    transferred: "Transferred",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[status] || styles.available}`}>
      {labels[status] || status}
    </span>
  );
}
