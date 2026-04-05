"use client";
import { useSharedState } from "@/app/context/SharedStateContext";
import { buildPageProps } from "@/lib/buildPageProps";
import OverviewPage from "@/app/views/OverviewPage";

export default function OverviewRoute() {
  const state = useSharedState();
  if (!state) return null;
  return <OverviewPage {...buildPageProps(state)} />;
}
