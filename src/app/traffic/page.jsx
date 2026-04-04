"use client";
import { useSharedState } from "@/app/context/SharedStateContext";
import { buildPageProps } from "@/lib/buildPageProps";
import ModePage from "@/app/views/ModePage";

export default function TrafficRoute() {
  const state = useSharedState();
  return <ModePage {...buildPageProps(state)} />;
}