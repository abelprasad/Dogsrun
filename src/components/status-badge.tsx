export type DogStatus = 'available' | 'pending' | 'adopted' | 'deceased' | 'transferred' | 'urgent' | 'rescue_requested' | 'placed';

interface StatusBadgeProps {
  status: DogStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<DogStatus, string> = {
    available: "bg-[#dcfce7] text-[#166534]",
    urgent: "bg-red-100 text-red-700",
    pending: "bg-[#fef3c7] text-[#92400e]",
    rescue_requested: "bg-blue-100 text-blue-700",
    placed: "bg-purple-100 text-purple-700",
    adopted: "bg-[#e0e7ff] text-[#3730a3]",
    deceased: "bg-[#f3f4f6] text-[#6b7280]",
    transferred: "bg-[#f3f4f6] text-[#6b7280]",
  };

  const labels: Record<DogStatus, string> = {
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
