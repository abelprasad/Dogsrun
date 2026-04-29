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
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white">Past Due</span>;
    }
    if (diffHours <= 24) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">Critical</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">At Risk</span>;
  }

  const styles: Record<string, string> = {
    available: "bg-green-100 text-green-700 border border-green-200",
    urgent: "bg-red-100 text-red-700 border border-red-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    rescue_requested: "bg-blue-100 text-blue-700 border border-blue-200",
    placed: "bg-green-100 text-green-700 border border-green-200",
    adopted: "bg-green-100 text-green-700 border border-green-200",
    deceased: "bg-gray-100 text-gray-500 border border-gray-200",
    transferred: "bg-gray-100 text-gray-500 border border-gray-200",
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status] || styles.available}`}>
      {labels[status] || status}
    </span>
  );
}
