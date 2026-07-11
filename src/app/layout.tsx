import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const display = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--font-display",
});
const body = Outfit({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Vixen Club — Fútbol 7 y Pádel en Pilar",
  description:
    "Torneos de fútbol 7 masculino y femenino, pádel, clases y eventos en Pilar, Buenos Aires. Inscripción temporada 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
