import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Proxygen — Intelligence Command Center",
  description: "Autonomous global data intelligence agent. Scrapes geo-restricted data via global proxies, structures with AI, and sells clean feeds via x402 micropayments on Solana.",
  keywords: ["proxygen", "autonomous agent", "data intelligence", "x402", "OOBE", "Ace Data Cloud", "SAP", "Solana"],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Proxygen — Intelligence Command Center",
    description: "Autonomous global data intelligence agent. Real-time geo-restricted data scraping, AI-powered extraction, and x402 micropayment economics.",
    url: "https://proxygen.edycu.dev",
    siteName: "Proxygen",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Proxygen — Autonomous Global Data Intelligence Agent",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proxygen — Intelligence Command Center",
    description: "Autonomous global data intelligence agent. Scrapes geo-restricted data via global proxies, structures with AI, and sells clean feeds via x402.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-bg-primary)]">
        {children}
      </body>
    </html>
  );
}
