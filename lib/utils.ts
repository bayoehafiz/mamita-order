export function parsePriceFromLabel(label?: string | null): number | null {
  if (!label || typeof label !== "string") return null;
  const match = label.match(/Rp\s?([\d.]+)/i);
  if (!match || !match[1]) return null;
  const parsed = parseInt(match[1].replace(/\./g, ""), 10);
  return isNaN(parsed) ? null : parsed;
}

export function formatRupiah(amount?: number | null): string {
  if (amount == null || isNaN(amount)) return "";
  return `Rp${Number(amount).toLocaleString("id-ID")}`;
}
