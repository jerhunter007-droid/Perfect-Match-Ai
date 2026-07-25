import type { Metadata, Viewport } from "next";
import "./globals.css";
import BetaGate from "@/components/BetaGate";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Perfect Match — AI-powered matchmaking",
  description: "The future of dating. Matched on who you are, not just how you look.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Perfect Match",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0E1F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-serif min-h-screen overscroll-none">
        <div
          className="w-full max-w-md mx-auto min-h-screen px-5"
          style={{
            paddingTop: "max(1.5rem, env(safe-area-inset-top))",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <BetaGate>{children}</BetaGate>
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
