"use client";

import { useState, useTransition } from "react";
import { submitPin } from "./actions";
import { useRouter } from "next/navigation";

const ShieldIcon = () => (
  <svg className="w-14 h-14 text-brand-chili mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setErrorMsg("PIN harus terdiri dari 6 digit.");
      return;
    }

    startTransition(async () => {
      setErrorMsg("");
      const res = await submitPin(pin);
      if (res.success) {
        // Trigger a hard navigation to /dapur to get around client-side route caching missing the cookie.
        window.location.href = "/dapur";
      } else {
        setErrorMsg(res.error || "Gagal masuk. Coba lagi.");
        setPin(""); // Clear the input on fail
      }
    });
  };

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        <ShieldIcon />
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Akses Dapur</h1>
        <p className="text-sm text-gray-500 mb-8">Masukkan 6 digit PIN untuk mengelola pesanan dan stok.</p>
        
        <form onSubmit={handlePinSubmit} className="space-y-6">
          <div>
            <input 
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setErrorMsg("");
                setPin(e.target.value.replace(/[^0-9]/g, ''));
              }}
              className={`w-full text-center text-3xl tracking-[1em] pl-[1em] py-4 font-bold rounded-2xl border ${errorMsg ? 'border-brand-chili focus:ring-brand-chili' : 'border-gray-200 focus:ring-brand-chili/20 focus:border-brand-chili'} bg-gray-50 focus:bg-white focus:ring-4 outline-none transition-all duration-200`}
              placeholder="••••••"
              autoComplete="off"
              disabled={isPending}
            />
            {errorMsg && (
              <p className="text-sm font-medium text-brand-chili mt-3 animate-pulse">{errorMsg}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isPending || pin.length !== 6}
            className="w-full flex items-center justify-center py-4 px-6 bg-brand-chili hover:bg-brand-chiliDark text-white font-bold rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? "Memverifikasi..." : <><LockIcon /> Buka Kunci</>}
          </button>
        </form>
      </div>
    </main>
  );
}
