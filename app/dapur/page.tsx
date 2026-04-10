import { AdminConfigForm } from "@/components/admin-config-form";
import { mapRowToPortalState } from "@/lib/portal-state";
import { readPortalStateRow } from "@/lib/portal-repository";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  let errorMessage: string | null = null;
  let config = null;

  try {
    const row = await readPortalStateRow();

    if (!row) {
      errorMessage = "Supabase belum punya data portal_state. Tambahkan satu baris dulu.";
    } else {
      config = mapRowToPortalState(row);
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Tidak bisa terhubung ke Supabase.";
  }

  return (
    <main className="min-h-screen bg-brand-cream py-8 px-4 sm:p-12">
      <section className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Manajemen Dapur</h1>
          <form action={async () => {
            "use server";
            const cookieStore = await cookies();
            cookieStore.delete("admin_session");
            redirect("/");
          }}>
            <button type="submit" className="inline-flex items-center justify-center min-h-[44px] gap-2 py-2.5 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors cursor-pointer border border-gray-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Keluar & Halaman Depan
            </button>
          </form>
        </div>
        <p className="text-sm text-gray-500 mb-8 max-w-xl">
          Gunakan panel ini untuk memantau status PO, update stok, dan pengumuman terbaru. Semua perubahan akan langsung terupdate di halaman depan pengguna ya!
        </p>

        {errorMessage ? (
          <p className="p-4 mb-6 bg-red-50 text-brand-chili font-medium rounded-xl border border-red-100">
            {errorMessage}
          </p>
        ) : null}

        {config ? <AdminConfigForm initialState={config} /> : null}
      </section>
    </main>
  );
}
