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
      className="text-xs font-bold text-[#9ca3af] hover:text-white transition-colors cursor-pointer uppercase tracking-widest"
    >
      Sign Out
    </button>
  );
}
