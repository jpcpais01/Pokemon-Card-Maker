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
      <body className="flex min-h-full flex-col">
        {/* Ambient aurora. Anchored to the top third and heavily blurred so it
            behaves like light in the room - every translucent panel above picks
            up a faint cast from it - rather than distinct colored shapes. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="blob h-[26rem] w-[26rem] bg-amber-500/22"
            style={{ top: "-9rem", left: "-7rem" }}
          />
          <div
            className="blob h-[24rem] w-[24rem] bg-violet-600/22"
            style={{ top: "-4rem", right: "-8rem", animationDelay: "-9s" }}
          />
          <div
            className="blob h-[22rem] w-[22rem] bg-cyan-500/12"
            style={{ top: "38%", left: "-6rem", animationDelay: "-17s" }}
          />
          <div
            className="blob h-[20rem] w-[20rem] bg-fuchsia-500/12"
            style={{ bottom: "-4rem", right: "-4rem", animationDelay: "-4s" }}
          />
          {/* Vignette floor: keeps the lower half of long screens from glowing
              and gives the fixed tab bar a clean dark field to sit against. */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07070c]/55 to-[#07070c]" />
        </div>
        <div aria-hidden className="grain" />
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
