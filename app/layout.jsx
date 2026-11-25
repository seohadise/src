import "@/styles/globals.css";

import localFont from "next/font/local";
import Script from "next/script";
import Providers from "./_providers";

import NextTopLoader from "nextjs-toploader";

import { Toaster } from "@/components/ui/sonner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const iranSans = localFont({
  src: [
    {
      path: "./fonts/Regular.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/Medium.woff2",
      style: "normal",
      weight: "500",
    },
    {
      path: "./fonts/Bold.woff2",
      style: "normal",
      weight: "700",
    },
  ],
});

export const metadata = {
  title: "اجاره ویلا و سوئیت در سراسر ایران | تریپ گود",
  description: "تریپ گود سامانه‌ای قابل اعتماد برای رزرو اقامتگاه، بلیط اتوبوس و سفارش غذای خانگی در سراسر ایران",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.webp", type: "image/webp" },
    ],
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "اجاره ویلا و سوئیت در سراسر ایران | تریپ گود",
  },
  other: {
    "theme-color": "#22c55e",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-TileColor": "#22c55e",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const RootLayout = ({ children }) => {
  return (
    <html suppressHydrationWarning lang="fa" dir="rtl">
      <body className={`${iranSans.className} gradient-bg`}>
        <div className="floating-shapes" />
        <Providers>
          <NextTopLoader color="#22c55e" height={4} showSpinner={false} />
          {children}
          <Toaster
            toastOptions={{
              classNames: {
                toast: iranSans.className,
                title: iranSans.className,
                description: iranSans.className,
              },
            }}
            richColors
            closeButton
          />
          <PWAInstallPrompt />
          <Script
            id="goftino-widget"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                !function(){
                  var i = "8k1ELh" ,a=window,d=document;
                  function g(){
                    var g=d.createElement("script"),
                    s="https://www.goftino.com/widget/"+i,
                    l=localStorage.getItem("goftino_"+i);
                    g.async=!0,g.src=l?s+"?o="+l:s;
                    d.getElementsByTagName("head")[0].appendChild(g);
                  }
                  "complete"===d.readyState?g():a.attachEvent?a.attachEvent("onload",g):a.addEventListener("load",g,!1);
                }();
              `,
            }}
          />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
