import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const blMelody = localFont({
  src: [
    { path: "../public/fonts/BLMelody-ExtraLight.otf", weight: "200" },
    { path: "../public/fonts/BLMelody-Light.otf", weight: "300" },
    { path: "../public/fonts/BLMelody-Regular.otf", weight: "400" },
    { path: "../public/fonts/BLMelody-Book.otf", weight: "450" },
    { path: "../public/fonts/BLMelody-Medium.otf", weight: "500" },
    { path: "../public/fonts/BLMelody-SemiBold.otf", weight: "600" },
    { path: "../public/fonts/BLMelody-Bold.otf", weight: "700" },
  ],
  display: "swap",
  variable: "--font-blmelody",
});

// MASTER_DESIGN.md fonts
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "BoatCheckin — Your charter trip, all in one link",
  description:
    "Check in, sign your waiver, and get your boarding pass — all from one link. No app download required.",
  icons: { icon: "/favicon.ico" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0B1D3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${blMelody.variable} ${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('[SW] Registered, scope:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[SW] Registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
