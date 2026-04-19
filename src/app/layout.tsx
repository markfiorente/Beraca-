import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beraca — Fondo de Ahorro Familiar",
  description: "Gestión del Fondo de Ahorro y Crédito Familiar Beraca",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full bg-navy text-white antialiased">{children}</body>
    </html>
  );
}
