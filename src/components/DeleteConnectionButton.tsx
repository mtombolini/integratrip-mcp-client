"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteConnectionButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("¿Eliminar esta conexión?")) return;
    setLoading(true);
    try {
      await fetch(`/api/connections/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
    >
      {loading ? "…" : "Eliminar"}
    </button>
  );
}
