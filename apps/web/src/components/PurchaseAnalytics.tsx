"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { onAnalyticsStateChange } from "@/lib/analytics-runtime";
import { createPurchaseTracker, PURCHASE_TRACKING_EVENT, requestPurchaseTracking } from "@/lib/purchase-analytics";

// One sender survives report redirects, delayed consent and repeated React effects.
const tracker = createPurchaseTracker();

export function PurchaseAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => { void tracker.flush(); }, 50);
    };
    const unsubscribe = onAnalyticsStateChange((ready) => { if (ready) schedule(); });
    window.addEventListener(PURCHASE_TRACKING_EVENT, schedule);
    window.addEventListener("online", schedule);
    window.addEventListener("focus", schedule);
    return () => {
      clearTimeout(timer);
      unsubscribe();
      window.removeEventListener(PURCHASE_TRACKING_EVENT, schedule);
      window.removeEventListener("online", schedule);
      window.removeEventListener("focus", schedule);
    };
  }, []);
  useEffect(() => { requestPurchaseTracking(); }, [pathname]);
  return null;
}
