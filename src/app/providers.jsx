// src/app/providers.jsx
"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { SharedStateProvider } from "@/app/context/SharedStateContext";

export default function Providers({ children }) {
  return (
    <ClerkProvider>
      <SharedStateProvider>{children}</SharedStateProvider>
    </ClerkProvider>
  );
}
