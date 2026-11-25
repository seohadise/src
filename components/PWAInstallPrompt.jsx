"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const DISMISS_KEY = "pwa-prompt-dismissed";

  useEffect(() => {
    console.log("[PWA] PWAInstallPrompt mounted");

    // بررسی نصب بودن PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    console.log("[PWA] Is standalone:", isStandalone);
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // بررسی اینکه کاربر قبلاً prompt را رد کرده یا نه
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (wasDismissed) {
      console.log("[PWA] Prompt previously dismissed, not showing again");
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      console.log("[PWA] beforeinstallprompt fired", e);
      e.preventDefault();
      setDeferredPrompt(e);
      // نمایش بعد از چند ثانیه
      setTimeout(() => setIsVisible(true), 3000);
    };

    const handleAppInstalled = () => {
      console.log("[PWA] appinstalled fired");
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // ثبت Service Worker
    if ("serviceWorker" in navigator) {
      console.log("[PWA] Registering SW...");
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] SW registered:", registration.scope);
          console.log("[PWA] SW active:", registration.active?.state);
          console.log("[PWA] SW installing:", registration.installing?.state);
          console.log("[PWA] SW waiting:", registration.waiting?.state);

          // بررسی آپدیت
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            console.log("[PWA] SW update found, state:", newWorker?.state);
            newWorker?.addEventListener("statechange", () => {
              console.log("[PWA] SW new state:", newWorker.state);
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // نسخه جدید موجود است
                if (confirm("نسخه جدید تریپ گود موجود است. آیا می‌خواهید به‌روزرسانی کنید؟")) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((err) => {
          console.error("[PWA] SW registration failed:", err);
        });
    } else {
      console.warn("[PWA] Service Worker not supported");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[PWA] User accepted install");
      setIsVisible(false);
      localStorage.setItem(DISMISS_KEY, "installed");
    } else if (outcome === "dismissed") {
      console.log("[PWA] User dismissed install");
      setIsVisible(false);
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    console.log("[PWA] Prompt dismissed by user");
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div className="fixed bottom-[5.5rem] left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 md:bottom-20">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-green-200 dark:border-green-800 p-4 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              نصب تریپ گود
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              تریپ گود را روی صفحه اصلی موبایل خود نصب کنید و سریع‌تر به سرویس‌ها دسترسی داشته باشید!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            نصب اپلیکیشن
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
          >
            بعداً
          </Button>
        </div>
      </div>
    </div>
  );
}
