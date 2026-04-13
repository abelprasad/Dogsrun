import React from 'react';

type Status = 'available' | 'pending' | 'adopted' | 'rescue_requested' | 'placed' | 'urgent';

interface StatusBadgeProps {
  status: Status | string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  available: { label: 'Available', classes: 'bg-green-100 text-green-800 border-green-200' },
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  adopted: { label: 'Adopted', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  rescue_requested: { label: 'Rescue Requested', classes: 'bg-purple-100 text-purple-800 border-purple-200' },
  placed: { label: 'Placed', classes: 'bg-gray-100 text-gray-800 border-gray-200' },
  urgent: { label: 'Urgent', classes: 'bg-red-100 text-red-800 border-red-200' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    classes: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  );
}
