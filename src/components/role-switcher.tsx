"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Store,
  UserCheck,
  ChevronDown,
  Check,
  Lock,
  Loader2,
} from "lucide-react";
import { DEMO_ACCOUNTS, DemoAccount } from "@/lib/auth-shared";

export function RoleSwitcher({
  currentSession,
}: {
  currentSession: DemoAccount;
}) {
  const [open, setOpen] = useState(false);
  const [switchingKey, setSwitchingKey] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchRole = async (account: DemoAccount) => {
    setSwitchingKey(account.key);
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey: account.key }),
      });
      const data = await res.json();
      setOpen(false);
      if (data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to switch role", e);
    } finally {
      setSwitchingKey(null);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "SUPERADMIN") return <ShieldCheck className="w-3.5 h-3.5" />;
    if (role === "STORE_ADMIN") return <Store className="w-3.5 h-3.5" />;
    return <UserCheck className="w-3.5 h-3.5" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        id="demo-role-switcher-trigger"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-[#0A0A0A] hover:bg-neutral-800 text-white border border-[#0A0A0A] transition-colors text-xs"
      >
        <span className="w-2 h-2 rounded-full bg-[#185B37] ring-2 ring-[#185B37]/40 flex-shrink-0" />
        <div className="text-left hidden sm:block">
          <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 font-medium leading-none">
            Role Switcher
          </div>
          <div className="font-semibold text-[11px] leading-tight mt-0.5 flex items-center gap-1">
            {switchingKey ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              getRoleIcon(currentSession.role)
            )}
            <span>{currentSession.label}</span>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          id="demo-role-switcher-menu"
          className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white border border-[#0A0A0A] shadow-lg z-50 overflow-hidden"
        >
          <div className="bg-[#0A0A0A] text-white px-4 py-3 flex items-center justify-between border-b border-neutral-800">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                RBAC 3-Tingkat • Session Switcher
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Pindah sesi instan untuk menguji isolasi multi-tenant
              </p>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-wider bg-neutral-900 text-neutral-300 border border-neutral-700 px-2 py-0.5">
              MySQL + Prisma
            </span>
          </div>

          <div className="divide-y divide-neutral-200">
            {DEMO_ACCOUNTS.map((acc) => {
              const isActive = acc.key === currentSession.key;
              const isLoading = switchingKey === acc.key;
              return (
                <button
                  key={acc.key}
                  type="button"
                  data-testid={`switch-role-${acc.key}`}
                  onClick={() => handleSwitchRole(acc)}
                  disabled={!!switchingKey}
                  className={`w-full text-left p-3 transition-colors flex items-start gap-3 ${
                    isActive ? "bg-[#FAFAFA]" : "bg-white hover:bg-neutral-50"
                  }`}
                >
                  <img
                    src={acc.avatar}
                    alt={acc.label}
                    className="w-9 h-9 object-cover border border-neutral-300 flex-shrink-0 mt-0.5 grayscale"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0A0A0A] text-xs truncate">
                        {acc.label}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 uppercase tracking-wider border ${
                          acc.role === "SUPERADMIN"
                            ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                            : acc.role === "STORE_ADMIN"
                            ? "bg-[#185B37]/10 text-[#185B37] border-[#185B37]/30"
                            : "bg-neutral-100 text-neutral-700 border-neutral-300"
                        }`}
                      >
                        {acc.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {acc.subLabel}
                    </p>
                    {acc.storeId && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                        <Lock className="w-2.5 h-2.5 text-[#185B37]" />
                        <span>storeId=&quot;{acc.storeId}&quot;</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 self-center">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-[#0A0A0A] animate-spin" />
                    ) : isActive ? (
                      <Check className="w-4 h-4 text-[#185B37]" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-[#FAFAFA] px-4 py-2 border-t border-neutral-200 text-[10px] text-neutral-500 flex items-center justify-between uppercase tracking-[0.12em]">
            <span>Guard: STORE_ADMIN terkunci ke /seller/*</span>
          </div>
        </div>
      )}
    </div>
  );
}
