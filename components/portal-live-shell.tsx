"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { OrderForm } from "@/components/order-form";
import { MegaphoneIcon, ChevronRightIcon, WarningIcon } from "@/components/icons";
import { deriveAvailabilityState } from "@/lib/portal-state";
import type { PortalState, AvailabilityState } from "@/lib/types";
import type { PortalStateRow } from "@/lib/portal-repository";

function mapRealtimePayload(row: Record<string, unknown>): PortalState {
  return {
    isOpen: Boolean(row.is_open),
    availableStock: Math.max(0, Number(row.available_stock) || 0),
    productName: String(row.product_name || ""),
    packLabel: String(row.pack_label || ""),
    sellerWhatsappNumber: String(row.seller_whatsapp_number || "").replace(/[^\d]/g, ""),
    pickupEnabled: Boolean(row.pickup_enabled),
    courierEnabled: Boolean(row.courier_enabled),
    sellerDeliveryEnabled: Boolean(row.seller_delivery_enabled),
    priceLabel: String(row.price_label || ""),
    announcementText: row.announcement_text ? String(row.announcement_text) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    updatedBy: row.updated_by ? String(row.updated_by) : undefined,
  };
}

const PORTAL_TABLE = process.env.NEXT_PUBLIC_SUPABASE_PORTAL_TABLE || "portal_state";

// ─── Main component ───

type PortalLiveShellProps = {
  initialConfig: PortalState;
};

export function PortalLiveShell({ initialConfig }: PortalLiveShellProps) {
  const [config, setConfig] = useState<PortalState>(initialConfig);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel("portal-state-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: PORTAL_TABLE },
        (payload) => {
          if (payload.new) {
            setConfig(mapRealtimePayload(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  const state = deriveAvailabilityState(config);
  const prevStateRef = useRef<AvailabilityState>(state);
  const [stockDropAlert, setStockDropAlert] = useState<string | null>(null);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    if (prev === "OPEN" && state !== "OPEN") {
      setStockDropAlert(
        state === "SOLD_OUT"
          ? "Waduh, stoknya baru aja habis. Pesananmu belum terkirim ya."
          : "PO baru ditutup nih. Chat Mamita aja buat info batch selanjutnya."
      );
    } else if (state === "OPEN" && prev !== "OPEN") {
      setStockDropAlert(null);
    }
  }, [state]);

  return (
    <>
      {/* ─── PRODUCT INFO CARD: overlaps the hero ─── */}
      <section className="relative z-10 -mt-24 mx-3 animate-fade-up">
        <div className="bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-8 text-center">
          <h1 className="sr-only">{config.productName}</h1>

          <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.15em] mb-4">{config.packLabel}</p>

          <p className="text-3xl font-extrabold text-brand-chili mb-4">{config.priceLabel}</p>

          {state === "CLOSED" ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              PO Belum Dibuka
            </span>
          ) : state === "SOLD_OUT" ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-red-50 text-brand-chiliDark border border-red-200">
              <span className="w-2 h-2 rounded-full bg-brand-chili" />
              Stok Habis!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-green-50 text-green-800 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {`Tersedia • ${Math.max(0, config.availableStock)} porsi`}
            </span>
          )}

          {config.announcementText ? (
            <div className="mt-5 flex items-start gap-3 bg-brand-amberSoft/60 rounded-2xl px-4 py-3.5 border border-brand-amber/40 text-left">
              <MegaphoneIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 font-medium leading-relaxed">{config.announcementText}</p>
            </div>
          ) : null}

          {/* Quick steps */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-brand-chili/10 text-brand-chili font-extrabold text-xs flex items-center justify-center">1</span>
                <span className="text-xs font-semibold text-gray-500">Isi Form</span>
              </div>
              <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-brand-chili/10 text-brand-chili font-extrabold text-xs flex items-center justify-center">2</span>
                <span className="text-xs font-semibold text-gray-500">Kirim WA</span>
              </div>
              <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-brand-chili/10 text-brand-chili font-extrabold text-xs flex items-center justify-center">3</span>
                <span className="text-xs font-semibold text-gray-500">Done!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ORDER FORM ─── */}
      <section className="px-3 pt-6 pb-4 animate-fade-up-delay">
        {stockDropAlert ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-fade-up" role="alert">
            <WarningIcon className="w-5 h-5 text-brand-chili shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-brand-chiliDark">{stockDropAlert}</p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-brand-chili underline cursor-pointer"
                onClick={() => setStockDropAlert(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        ) : null}
        {state === "OPEN" ? (
          <OrderForm config={config} />
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center border border-gray-100">
            <p className="text-sm font-medium text-gray-600">
              PO belum tersedia. Chat Mamita aja ya di WhatsApp!
            </p>
          </div>
        )}
      </section>
    </>
  );
}
