import { SITE } from "@/config/site";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

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
      className="h-full antialiased"
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
