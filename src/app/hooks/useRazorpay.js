"use client";
import { useCallback } from "react";

/**
 * Loads the Razorpay checkout script and opens the payment popup.
 * Usage: const { pay } = useRazorpay();
 *        pay({ amount: 4999, planName: "Starter", email: "user@example.com" })
 */
export function useRazorpay() {
  const loadScript = () =>
    new Promise((resolve) => {
      if (document.getElementById("razorpay-script")) return resolve(true);
      const s = document.createElement("script");
      s.id  = "razorpay-script";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload  = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const pay = useCallback(async ({ amount, planName, onSuccess, onError }) => {
    const loaded = await loadScript();
    if (!loaded) {
      alert("Failed to load payment gateway. Check your connection.");
      return;
    }

    // Create order on server
    const res = await fetch("/api/create-order", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ amount, planName }),
    });

    if (!res.ok) {
      if (onError) onError("Could not initiate payment.");
      return;
    }

    const { orderId, currency } = await res.json();

    const options = {
      key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount:      amount * 100,
      currency:    currency ?? "INR",
      name:        "UrbanTwins",
      description: `${planName} Plan — Monthly Subscription`,
      order_id:    orderId,
      image:       "/favicon.ico",
      theme:       { color: "#639922" },
      handler: (response) => {
        // Payment successful
        if (onSuccess) onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          if (onError) onError("Payment cancelled.");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, []);

  return { pay };
}
