"use client";

import { useRef, useMemo, useState } from "react";
import type { PortalState } from "@/lib/types";

type FormState = {
  productName: string;
  packLabel: string;
  priceLabel: string;
  sellerWhatsappNumber: string;
  availableStock: number;
  isOpen: boolean;
  pickupEnabled: boolean;
  courierEnabled: boolean;
  sellerDeliveryEnabled: boolean;
  announcementText: string;
};

type AdminConfigFormProps = {
  initialState: PortalState;
};

const SaveIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const CheckIcon = () => (
   <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

function toFormState(state: PortalState): FormState {
  return {
    productName: state.productName,
    packLabel: state.packLabel,
    priceLabel: state.priceLabel,
    sellerWhatsappNumber: state.sellerWhatsappNumber,
    availableStock: state.availableStock,
    isOpen: state.isOpen,
    pickupEnabled: state.pickupEnabled,
    courierEnabled: state.courierEnabled,
    sellerDeliveryEnabled: state.sellerDeliveryEnabled,
    announcementText: state.announcementText || ""
  };
}

function isFormDirty(current: FormState, saved: FormState): boolean {
  return (
    current.productName !== saved.productName ||
    current.packLabel !== saved.packLabel ||
    current.priceLabel !== saved.priceLabel ||
    current.sellerWhatsappNumber !== saved.sellerWhatsappNumber ||
    current.availableStock !== saved.availableStock ||
    current.isOpen !== saved.isOpen ||
    current.pickupEnabled !== saved.pickupEnabled ||
    current.courierEnabled !== saved.courierEnabled ||
    current.sellerDeliveryEnabled !== saved.sellerDeliveryEnabled ||
    current.announcementText !== saved.announcementText
  );
}

export function AdminConfigForm({ initialState }: AdminConfigFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialState));
  const savedSnapshot = useRef<FormState>(toFormState(initialState));
  const [updatedBy, setUpdatedBy] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(initialState.updatedAt || null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState(initialState.updatedBy || null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    const response = await fetch("/api/dapur/portal-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        updatedBy: updatedBy || undefined
      })
    });

    const result = (await response.json().catch(() => ({}))) as Partial<PortalState> & { error?: string };

    if (!response.ok) {
      setStatus("error");
      setError(result.error || "Tidak bisa menyimpan konfigurasi.");
      return;
    }

    const nextForm: FormState = {
      productName: result.productName || form.productName,
      packLabel: result.packLabel || form.packLabel,
      priceLabel: result.priceLabel || form.priceLabel,
      sellerWhatsappNumber: result.sellerWhatsappNumber || form.sellerWhatsappNumber,
      availableStock: result.availableStock ?? form.availableStock,
      isOpen: result.isOpen ?? form.isOpen,
      pickupEnabled: result.pickupEnabled ?? form.pickupEnabled,
      courierEnabled: result.courierEnabled ?? form.courierEnabled,
      sellerDeliveryEnabled: result.sellerDeliveryEnabled ?? form.sellerDeliveryEnabled,
      announcementText: result.announcementText || ""
    };

    setForm(nextForm);
    savedSnapshot.current = nextForm;

    setUpdatedBy("");
    setLastUpdatedAt(result.updatedAt || null);
    setLastUpdatedBy(result.updatedBy || updatedBy || null);
    setStatus("success");
    window.setTimeout(() => setStatus("idle"), 1600);
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current PO State</p>
          <strong className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase shadow-sm ${form.isOpen ? 'bg-green-100 text-green-800 border fill-current border-green-200' : 'bg-red-50 text-brand-chili border border-red-200'}`}>
            {form.isOpen ? "OPEN" : "CLOSED"}
          </strong>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terakhir Diperbarui</p>
          <p className="text-sm font-medium text-gray-900">
            {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("id-ID", { 
              dateStyle: "medium", 
              timeStyle: "short" 
            }) : "—"}
            {lastUpdatedBy ? <span className="text-gray-500 font-normal"> • {lastUpdatedBy}</span> : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className={`p-6 rounded-2xl border-2 flex flex-col justify-between gap-6 shadow-sm transition-colors ${form.isOpen ? 'bg-green-50/50 border-green-500' : 'bg-red-50/50 border-brand-chili'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`text-xl font-extrabold mb-1 ${form.isOpen ? 'text-green-800' : 'text-brand-chiliDark'}`}>Status Pre-Order</h3>
              <p className={`text-sm font-medium ${form.isOpen ? 'text-green-700/80' : 'text-red-800/80'}`}>
                {form.isOpen ? 'PO sedang DIBUKA dan menerima pesanan dari pembeli.' : 'PO sedang DITUTUP sementara waktu.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={form.isOpen}
                onChange={(event) => updateField("isOpen", event.target.checked)} 
              />
              <div className="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-chili/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl border-2 border-brand-amberSoft bg-brand-cream/30 flex flex-col justify-between gap-6 shadow-sm">
            <div>
              <h3 className="text-xl font-extrabold text-brand-chiliDark mb-1">Stok Tersedia</h3>
              <p className="text-sm font-medium text-gray-500">Sesuaikan jumlah porsi yang bisa dipesan Bunda.</p>
            </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => updateField("availableStock", Math.max(0, form.availableStock - 1))}
              className="w-14 h-12 flex items-center justify-center bg-white hover:bg-red-50 text-gray-800 hover:text-red-600 font-bold rounded-xl outline-none transition-colors border border-gray-200 hover:border-red-200 shrink-0 shadow-sm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
            </button>
            <input
              type="number"
              min={0}
              className="flex-1 w-full text-center px-4 py-2.5 rounded-xl border border-brand-amberSoft bg-white focus:ring-2 focus:ring-brand-amber/40 focus:border-brand-amber outline-none transition-all duration-200 text-xl font-bold text-brand-chili shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none m-0"
              value={form.availableStock}
              onChange={(event) => updateField("availableStock", Number(event.target.value) || 0)}
              required
            />
             <button 
              type="button" 
              onClick={() => updateField("availableStock", form.availableStock + 1)}
              className="w-14 h-12 flex items-center justify-center bg-brand-chili hover:bg-brand-chiliDark text-white font-bold rounded-xl outline-none transition-colors border border-brand-chili shrink-0 shadow-sm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-800">Label Kemasan</span>
          <input
            type="text"
             className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-chili/20 focus:border-brand-chili outline-none transition-all duration-200 text-sm"
            value={form.packLabel}
            onChange={(event) => updateField("packLabel", event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-800">Label Harga</span>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-chili/20 focus:border-brand-chili outline-none transition-all duration-200 text-sm"
            value={form.priceLabel}
            onChange={(event) => updateField("priceLabel", event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-800">No. WhatsApp Admin</span>
          <input
            type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-chili/20 focus:border-brand-chili outline-none transition-all duration-200 text-sm"
            value={form.sellerWhatsappNumber}
            onChange={(event) => updateField("sellerWhatsappNumber", event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-800">Nama Produk</span>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-chili/20 focus:border-brand-chili outline-none transition-all duration-200 text-sm"
            value={form.productName}
            onChange={(event) => updateField("productName", event.target.value)}
            required
          />
          <span className="text-xs text-gray-400 italic">Hanya muncul di pesan WhatsApp, tidak di halaman depan.</span>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-gray-800">Isi Pengumuman (pilihan)</span>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-chili/20 focus:border-brand-chili outline-none transition-all duration-200 text-sm"
            value={form.announcementText}
            onChange={(event) => updateField("announcementText", event.target.value)}
            rows={2}
            placeholder="Misal: Batch minggu ini sisa sedikit lagi!"
          />
        </label>
      </div>

      <div className="bg-brand-cream/40 p-6 rounded-2xl border border-brand-amberSoft/80 space-y-4">

        <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-brand-amber/30 hover:shadow-sm">
          <input
             type="checkbox"
            className="w-5 h-5 text-brand-chili border-gray-300 rounded focus:ring-brand-chili accent-brand-chili cursor-pointer"
            checked={form.pickupEnabled}
            onChange={(event) => updateField("pickupEnabled", event.target.checked)}
          />
          <span className="font-semibold text-gray-800">Aktifkan Ambil Sendiri</span>
        </label>

        <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-brand-amber/30 hover:shadow-sm">
          <input
            type="checkbox"
            className="w-5 h-5 text-brand-chili border-gray-300 rounded focus:ring-brand-chili accent-brand-chili cursor-pointer"
            checked={form.courierEnabled}
            onChange={(event) => updateField("courierEnabled", event.target.checked)}
          />
          <span className="font-semibold text-gray-800">Aktifkan Grab / Gojek</span>
        </label>

        <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-brand-amber/30 hover:shadow-sm">
          <input
            type="checkbox"
            className="w-5 h-5 text-brand-chili border-gray-300 rounded focus:ring-brand-chili accent-brand-chili cursor-pointer"
            checked={form.sellerDeliveryEnabled}
            onChange={(event) => updateField("sellerDeliveryEnabled", event.target.checked)}
          />
          <span className="font-semibold text-gray-800">Aktifkan Diantar Penjual</span>
        </label>
      </div>

      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-6">
        <label className="flex flex-col gap-1.5 w-full sm:w-1/3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Nama Pengubah</span>
          <input 
            type="text" 
             className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-chili/20 focus:border-brand-chili outline-none transition-all duration-200 text-sm"
            value={updatedBy} 
            onChange={(event) => setUpdatedBy(event.target.value)} 
            placeholder="Contoh: Mama" 
            disabled={status === "saving"}
          />
        </label>
        
        <div className="flex-1 w-full flex items-center justify-end">
         {error ? <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium mr-4 border border-red-100">{error}</span> : null}
         {status === "success" ? <span className="flex items-center font-bold text-green-600 mr-4 animate-pulse"><CheckIcon /> Tersimpan!</span> : null}

          <button 
            className="w-full sm:w-auto py-3.5 px-6 mt-5 sm:mt-2 bg-gray-900 hover:bg-gray-800 active:bg-black text-white font-bold rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
            type="submit" 
            disabled={status === "saving" || !isFormDirty(form, savedSnapshot.current)}
          >
            {status === "saving" ? "Menyimpan Konfigurasi..." : <><SaveIcon /> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </form>
  );
}
