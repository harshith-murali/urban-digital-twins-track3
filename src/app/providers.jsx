// src/app/providers.jsx
"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { SharedStateProvider } from "@/app/context/SharedStateContext";
import { SubscriptionProvider } from "@/app/context/SubscriptionContext";

export default function Providers({ children }) {
  return (
    <ClerkProvider>
      <SubscriptionProvider>
        <SharedStateProvider>{children}</SharedStateProvider>
      </SubscriptionProvider>
    </ClerkProvider>
  );
}
