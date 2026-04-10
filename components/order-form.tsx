"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DELIVERY_LABELS } from "@/lib/constants";
import { deriveAvailabilityState } from "@/lib/portal-state";
import { parsePriceFromLabel, formatRupiah } from "@/lib/utils";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { validateOrderForm } from "@/lib/validation";
import { UserIcon, ClipboardIcon, CheckIcon, WhatsAppIcon, SpinnerIcon } from "@/components/icons";
import type { DeliveryMethod, OrderFormState, PortalState, ValidationErrors } from "@/lib/types";

const INITIAL_FORM: OrderFormState = {
  name: "",
  quantity: 1,
  deliveryMethod: "",
  address: ""
};

type OrderFormProps = {
  config: PortalState;
};

export function OrderForm({ config }: OrderFormProps) {
  const availabilityState = deriveAvailabilityState(config);
  const [form, setForm] = useState<OrderFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableMethods = useMemo(() => {
    const methods: DeliveryMethod[] = [];

    if (config.pickupEnabled) {
      methods.push("pickup");
    }

    if (config.courierEnabled) {
      methods.push("courier");
    }

    if (config.sellerDeliveryEnabled) {
      methods.push("seller_delivery");
    }

    return methods;
  }, [config]);

  const showAddress = form.deliveryMethod !== "" && form.deliveryMethod !== "pickup";
  const isOrderDisabled = availabilityState !== "OPEN";

  function updateForm<K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function updateQuantity(nextQuantity: number) {
    const bounded = Math.min(Math.max(nextQuantity, 1), Math.max(config.availableStock, 1));
    updateForm("quantity", bounded);
  }

  // B.5.2 — Re-bound quantity when stock changes via Realtime
  useEffect(() => {
    if (form.quantity > config.availableStock && config.availableStock > 0) {
      setForm((current) => ({ ...current, quantity: config.availableStock }));
    }
  }, [config.availableStock]); // eslint-disable-line react-hooks/exhaustive-deps

  const unitPrice = useMemo(() => parsePriceFromLabel(config.priceLabel), [config.priceLabel]);
  const estimatedTotal = unitPrice ? unitPrice * form.quantity : null;

  // D.6.2 — Quantity pop micro-animation
  const [qtyAnimating, setQtyAnimating] = useState(false);
  const prevQtyRef = useRef(form.quantity);

  useEffect(() => {
    if (form.quantity !== prevQtyRef.current) {
      prevQtyRef.current = form.quantity;
      setQtyAnimating(true);
      const timer = window.setTimeout(() => setQtyAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [form.quantity]);

  async function copyFallbackMessage() {
    if (!fallbackMessage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(fallbackMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateOrderForm(form, config);

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      // B.2.3 — Scroll to first errored field so mobile users see it
      const firstErrorKey = Object.keys(validation)[0];
      window.requestAnimationFrame(() => {
        document.getElementById(firstErrorKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    const message = buildWhatsAppMessage(form, config);
    const whatsappUrl = buildWhatsAppUrl(config.sellerWhatsappNumber, message);
    setFallbackMessage(message);
    setIsSubmitting(true);

    // Brief delay so user sees loading state before navigation
    window.setTimeout(() => {
      try {
        window.location.assign(whatsappUrl);
      } catch {
        // Redirect threw — show fallback immediately
        setIsSubmitting(false);
        return;
      }

      // Safety: if page hasn't navigated after 2.5s, assume redirect failed silently
      window.setTimeout(() => setIsSubmitting(false), 2500);
    }, 600);
  }

  return (
    <>
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" id="order-form">
        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold tracking-wider text-brand-chili uppercase mb-1">Form Pesanan</p>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            {isOrderDisabled ? "PO Belum Dibuka" : "Yuk, Pesan Sekarang!"}
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {isOrderDisabled
              ? config.announcementText || "Chat Mamita aja buat tanya PO berikutnya ya."
              : "Isi form ini, nanti pesananmu langsung dikirim ke WhatsApp Mamita. Gampang!"}
          </p>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-bold text-gray-800">Nama</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  maxLength={100}
                  placeholder="Nama kamu"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={`w-full h-14 pl-11 pr-4 rounded-xl border ${errors.name ? 'border-brand-chili focus:ring-brand-chili' : 'border-gray-200 focus:ring-brand-chili/30 focus:border-brand-chili'} bg-white focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-[15px] font-medium placeholder-gray-400 shadow-sm`}
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  disabled={isOrderDisabled}
                />
              </div>
              {errors.name ? <span id="name-error" role="alert" className="text-sm font-medium text-brand-chili mt-1">{errors.name}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="quantity" className="text-sm font-bold text-gray-800 text-center select-none pt-2">Berapa porsi?</label>
              <div role="group" aria-label="Jumlah porsi" className="flex items-center justify-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 shadow-inner max-w-xs mx-auto w-full">
                <button
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-white text-gray-800 font-extrabold text-2xl hover:bg-red-50 hover:text-brand-chili active:scale-95 transition-all shadow-sm border border-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  onClick={() => updateQuantity(form.quantity - 1)}
                  disabled={isOrderDisabled || form.quantity <= 1}
                  aria-label="Kurangi jumlah"
                >
                  -
                </button>
                <div className="flex-1 relative">
                  <input
                    id="quantity"
                    className={`w-full text-center font-black text-3xl bg-transparent outline-none disabled:opacity-50 transition-all duration-200 text-brand-chiliDark [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${qtyAnimating ? 'animate-qty-pop' : ''}`}
                    name="quantity"
                    type="number"
                    role="spinbutton"
                    aria-valuenow={form.quantity}
                    aria-valuemin={1}
                    aria-valuemax={Math.max(config.availableStock, 1)}
                    aria-invalid={!!errors.quantity}
                    aria-describedby={errors.quantity ? 'quantity-error' : 'quantity-stock'}
                    min={1}
                    max={Math.max(config.availableStock, 1)}
                    value={form.quantity}
                    onChange={(event) => updateQuantity(Number(event.target.value))}
                    disabled={isOrderDisabled}
                  />
              <span className="absolute -bottom-4 inset-x-0 text-center text-[10px] font-bold uppercase text-gray-400 tracking-widest">Porsi</span>
                </div>
                <button
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-brand-chili text-white font-extrabold text-2xl hover:bg-brand-chiliDark active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  onClick={() => updateQuantity(form.quantity + 1)}
                  disabled={isOrderDisabled || form.quantity >= config.availableStock}
                  aria-label="Tambah jumlah"
                >
                  +
                </button>
              </div>
              {estimatedTotal ? (
                <p className="text-sm font-bold text-brand-chiliDark text-center mt-2">
                  Estimasi: {formatRupiah(estimatedTotal)}
                  <span className="block text-[10px] font-medium text-gray-400 mt-0.5">({form.quantity} × {config.priceLabel})</span>
                </p>
              ) : null}
              <span id="quantity-stock" className="text-xs font-semibold text-brand-chili text-center block mt-1">Sisa stok: {config.availableStock} porsi</span>
              {errors.quantity ? <span id="quantity-error" role="alert" className="text-sm font-medium text-brand-chili mt-1 text-center">{errors.quantity}</span> : null}
            </div>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-bold text-gray-800">Pengiriman</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Metode pengiriman">
                {availableMethods.map((method) => (
                  <label key={method} className={`relative flex items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${form.deliveryMethod === method ? 'border-brand-chili bg-red-50 text-brand-chiliDark shadow-[0_4px_12px_rgba(212,42,30,0.1)] scale-[1.02]' : 'border-gray-100 hover:border-brand-amber/40 hover:bg-gray-50 bg-white text-gray-700'} ${isOrderDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      className="sr-only"
                      name="deliveryMethod"
                      id={`delivery-${method}`}
                      checked={form.deliveryMethod === method}
                      onChange={() => updateForm("deliveryMethod", method)}
                      disabled={isOrderDisabled}
                    />
                    <span className="text-[14px] font-extrabold tracking-wide text-center leading-snug">{DELIVERY_LABELS[method]}</span>
                  </label>
                ))}
              </div>
              {!form.deliveryMethod ? (
                <span className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-1 border border-gray-100 italic">
                  Isi alamat kalau pilih Grab/Gojek atau Diantar ya.
                </span>
              ) : null}
              {errors.deliveryMethod ? <span id="delivery-error" role="alert" className="text-sm font-medium text-brand-chili mt-1">{errors.deliveryMethod}</span> : null}
            </fieldset>

            {/* D.6.1 — Animated address reveal */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showAddress ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                {showAddress ? (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label htmlFor="address" className="text-sm font-bold text-gray-800">Alamat</label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      maxLength={300}
                      placeholder="Alamat lengkap + patokan biar kurir gak bingung"
                      aria-invalid={!!errors.address}
                      aria-describedby={errors.address ? 'address-error' : undefined}
                      className={`w-full p-4 rounded-2xl border ${errors.address ? 'border-brand-chili focus:ring-brand-chili' : 'border-gray-200 focus:ring-brand-chili/30 focus:border-brand-chili'} bg-white focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-[15px] font-medium resize-none shadow-sm placeholder-gray-400`}
                      value={form.address}
                      onChange={(event) => updateForm("address", event.target.value)}
                      disabled={isOrderDisabled}
                    />
                    {errors.address ? <span id="address-error" role="alert" className="text-sm font-medium text-brand-chili mt-1">{errors.address}</span> : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* B.2.1 — Live order summary */}
            {form.name.trim() && form.deliveryMethod ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2">Pesananmu</p>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <p><span className="font-semibold text-gray-900">{form.name.trim()}</span></p>
                  <p>{config.productName} × <span className="font-bold text-brand-chiliDark">{form.quantity} Porsi</span></p>
                  <p>Pengiriman: <span className="font-semibold">{DELIVERY_LABELS[form.deliveryMethod as DeliveryMethod]}</span></p>
                  {showAddress && form.address.trim() ? <p className="text-xs text-gray-500 truncate">Alamat: {form.address.trim()}</p> : null}
                  {estimatedTotal ? (
                    <p className="pt-1.5 border-t border-gray-200 font-bold text-brand-chiliDark">
                      Estimasi Total: {formatRupiah(estimatedTotal)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="pt-2">
              <button 
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da851] text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all focus:ring-4 focus:ring-green-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                type="submit" 
                disabled={isOrderDisabled || isSubmitting}
              >
                {isSubmitting ? <><SpinnerIcon className="w-4 h-4 mr-2" /> Menyiapkan WhatsApp...</> : <><WhatsAppIcon className="w-5 h-5 mr-2" /> Kirim WhatsApp</>}
              </button>
            </div>
          </form>
        </div>
      </section>

      {fallbackMessage ? (
        <section className="mt-6 bg-brand-amberSoft/50 rounded-2xl border border-brand-amber/60 overflow-hidden shadow-sm" aria-live="polite">
          <div className="p-5 sm:p-6">
            <p className="text-xs font-bold tracking-wider text-amber-700 uppercase mb-1">Backup Pesan</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2">WhatsApp belum terbuka?</h3>
            <p className="text-sm text-gray-700 mb-4">
              Salin pesan ini, buka WhatsApp manual, lalu tempel ke chat Mamita.
            </p>
            <div className="flex flex-col gap-1.5">
              <textarea 
                className="w-full p-4 rounded-xl border border-amber-200 bg-white text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" 
                readOnly 
                rows={6}
                value={fallbackMessage} 
              />
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button 
                className="w-full sm:w-1/2 py-3 px-4 bg-brand-chili hover:bg-brand-chiliDark text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer" 
                type="button" 
                onClick={copyFallbackMessage}
              >
                {copied ? <><CheckIcon className="w-5 h-5 mr-2" /> Tersalin!</> : <><ClipboardIcon className="w-5 h-5 mr-2" /> Salin Pesan</>}
              </button>
              <a
                className="w-full sm:w-1/2 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
                href={buildWhatsAppUrl(config.sellerWhatsappNumber, fallbackMessage)}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon className="w-5 h-5 mr-2" /> Buka WhatsApp
              </a>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
