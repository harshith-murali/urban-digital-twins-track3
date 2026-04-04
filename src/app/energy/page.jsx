"use client";
import { useSharedState } from "@/app/context/SharedStateContext";
import ModePage from "@/app/views/ModePage";
import { buildPageProps } from "@/lib/buildPageProps";

export default function EnergyRoute() {
  const state = useSharedState();
  return <ModePage {...buildPageProps(state)} />;
}