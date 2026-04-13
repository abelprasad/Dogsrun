'use client';

import { createClient } from '@/lib/supabase';

export default function SignOutButton() {
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
    >
      Sign Out
    </button>
  );
}
