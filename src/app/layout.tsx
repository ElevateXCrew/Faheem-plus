import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./red-effects.css";
import { Toaster } from "@/components/ui/toaster";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { VisitTracker } from "@/components/VisitTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Faheema - Premium Content & Exclusive Experiences",
  description: "Discover exclusive premium content and elevate your creative journey with our curated collection. Join our community of discerning members today.",
  keywords: ["premium content", "exclusive access", "creative resources", "subscription", "membership", "gallery", "premium images"],
  authors: [{ name: "Faheema Team" }],
  icons: {
    icon: "/images/hero-bg.png",
    shortcut: "/images/hero-bg.png",
    apple: "/images/hero-bg.png",
  },
  openGraph: {
    title: "Faheema- Premium Content & Exclusive Experiences",
    description: "Discover exclusive premium content and elevate your creative journey with our curated collection.",
    url: "https://faheema.com",
    siteName: "Faheema",
    type: "website",
    images: ["/images/hero-bg.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Faheema - Premium Content",
    description: "Discover exclusive premium content and elevate your creative journey.",
    images: ["/images/hero-bg.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/hero-bg.png" type="image/png" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Disable right click
            document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

            // Disable keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              // F12
              if (e.key === 'F12') { e.preventDefault(); return false; }
              // Ctrl+Shift+I / Cmd+Option+I
              if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return false; }
              // Ctrl+Shift+J
              if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false; }
              // Ctrl+Shift+C
              if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); return false; }
              // Ctrl+U (view source)
              if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
              // Ctrl+S (save page)
              if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) { e.preventDefault(); return false; }
              // Ctrl+A (select all)
              if ((e.ctrlKey || e.metaKey) && (e.key === 'A' || e.key === 'a')) { e.preventDefault(); return false; }
            });

            // Disable text selection
            document.addEventListener('selectstart', function(e) { e.preventDefault(); });

            // Disable drag
            document.addEventListener('dragstart', function(e) { e.preventDefault(); });

            // DevTools detection - redirect if opened
            var devtools = { open: false };
            var threshold = 160;
            setInterval(function() {
              if (
                window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold
              ) {
                if (!devtools.open) {
                  devtools.open = true;
                  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-size:24px;font-family:sans-serif;">⛔ Access Denied</div>';
                }
              } else {
                devtools.open = false;
              }
            }, 500);
          })();
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <VisitTracker />
        <Toaster />
        <WhatsAppButton />
      </body>
    </html>
  );
}
