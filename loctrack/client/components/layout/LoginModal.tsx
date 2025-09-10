import React, { useState } from "react";
import { signInLocal } from "@/lib/auth";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return alert("Masukkan email");
    signInLocal({ email, name: name || email.split("@")[0], isAdmin });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Login (lokal)</h3>
        <label className="block text-sm">Email</label>
        <input className="w-full rounded border px-2 py-1 mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-sm">Nama (opsional)</label>
        <input className="w-full rounded border px-2 py-1 mb-3" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="flex items-center gap-2 text-sm mb-3"><input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} /> Jadikan Admin (lokal)</label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">Batal</button>
          <button type="submit" className="rounded bg-primary px-3 py-1 text-primary-foreground">Login</button>
        </div>
      </form>
    </div>
  );
}
