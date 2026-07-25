"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TABS = [
  { href: "/account", label: "Account" },
  { href: "/matches", label: "Stack" },
  { href: "/duo", label: "Duo" },
  { href: "/chat", label: "Chat" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data } = await supabase.rpc("unread_message_count");
      if (!cancelled) setUnread(data ?? 0);
    }
    check();
    const interval = setInterval(check, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-md mx-auto flex justify-around items-center py-2">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className="relative flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1">
              <span className={`text-xs font-mono ${active ? "text-cyan" : "text-muted"}`}>{tab.label.toUpperCase()}</span>
              {tab.href === "/chat" && unread > 0 && (
                <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-cyan" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
