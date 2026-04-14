export type DogStatus = 'available' | 'pending' | 'adopted' | 'deceased' | 'transferred';

interface StatusBadgeProps {
  status: DogStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    available: "bg-[#dcfce7] text-[#166534]",
    pending: "bg-[#fef3c7] text-[#92400e]",
    adopted: "bg-[#e0e7ff] text-[#3730a3]",
    deceased: "bg-[#f3f4f6] text-[#6b7280]",
    transferred: "bg-[#f3f4f6] text-[#6b7280]",
  };

  const labels = {
    available: "Available",
    pending: "Pending",
    adopted: "Adopted",
    deceased: "Deceased",
    transferred: "Transferred",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
