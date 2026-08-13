import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://memory-authority.ljjones31.chatgpt.site"),
  title: "Memory Authority — Deterministic memory outside the model",
  description:
    "A model-independent encrypted memory authority that compiles provenance-bearing evidence before inference.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Memory Authority",
    description: "Memory belongs outside the model.",
    type: "website",
    images: [{ url: "/og.png", width: 1792, height: 909, alt: "Memory Authority — memory belongs outside the model" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Authority",
    description: "Evidence before inference. Memory outside the model.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
