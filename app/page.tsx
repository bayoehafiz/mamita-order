import Image from "next/image";
import { getPortalState } from "@/lib/portal-state";
import { PortalLiveShell } from "@/components/portal-live-shell";

export const dynamic = "force-dynamic";

export default async function Page() {
  const config = await getPortalState();

  return (
    <main className="container-xs min-h-screen pb-8">
      {/* ─── HERO: Full-bleed product image (static, rendered server-side) ─── */}
      <div className="relative w-full h-[75vh] max-h-[600px] min-h-[400px] overflow-hidden">
        <Image
          src="/mamita-banner.jpeg"
          alt="Martabak Bihun Mamita"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-cream via-brand-cream/60 to-transparent" />
      </div>

      {/* ─── LIVE CONTENT: product card, form, sticky CTA (Supabase Realtime) ─── */}
      <PortalLiveShell initialConfig={config} />
    </main>
  );
}
