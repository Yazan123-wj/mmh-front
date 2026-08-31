import { SITE } from "@/config/site";
import type { Metadata, Viewport } from "next";
import { Alexandria, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const alexandria = Alexandria({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#17182b",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "MMH — Digital gaming codes and top-ups in Jordan",
    template: "%s · MMH",
  },
  description: SITE.description,
  icons: { icon: "/brand/IMG_4556.png" },
  openGraph: {
    siteName: "MMH",
    locale: "en_JO",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-input="pointer"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${alexandria.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Script id="mmh-boot" strategy="beforeInteractive">
          {`(function(){try{var r=document.documentElement;r.setAttribute('data-input','pointer');var l=localStorage.getItem('mmh-locale');if(l&&l.indexOf('ar')!==-1){r.lang='ar';r.dir='rtl';}}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
