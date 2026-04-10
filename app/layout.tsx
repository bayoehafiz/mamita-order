import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFBF7",
};

export const metadata: Metadata = {
  title: "Mamita Pre-Order",
  description: "Pesan Martabak Bihun Mamita langsung via WhatsApp. Tinggal isi form, klik kirim, selesai!",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mamita",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-brand-cream">{children}</body>
    </html>
  );
}
