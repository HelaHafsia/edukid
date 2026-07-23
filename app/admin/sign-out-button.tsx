"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/connexion" })}
      className="w-full text-left text-sm text-slate-500 hover:text-slate-900"
    >
      Se déconnecter
    </button>
  );
}
