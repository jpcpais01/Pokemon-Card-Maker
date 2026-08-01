import type { Metadata, Viewport } from "next";
import { Baloo_2, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ??
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ??
  "http://localhost:3000";

const description = "Open a pack of random traits and get a one-of-a-kind AI-generated Pokemon TCG illustration.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PokeGen",
  description,
  openGraph: {
    title: "PokeGen",
    description,
    siteName: "PokeGen",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PokeGen",
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#05060f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${baloo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#05060f] text-slate-100">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="blob h-72 w-72 bg-amber-500/30" style={{ top: "-4rem", left: "-3rem" }} />
          <div className="blob h-80 w-80 bg-violet-600/25" style={{ top: "18%", right: "-5rem", animationDelay: "-7s" }} />
          <div className="blob h-72 w-72 bg-teal-500/20" style={{ bottom: "-3rem", left: "10%", animationDelay: "-14s" }} />
          <div className="blob h-64 w-64 bg-fuchsia-500/15" style={{ bottom: "12%", right: "5%", animationDelay: "-3s" }} />
        </div>
        <div aria-hidden className="grain" />
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
