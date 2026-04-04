"use client";
import { useSharedState } from "@/app/context/SharedStateContext";
import { buildPageProps } from "@/lib/buildPageProps";   
import OverviewPage from "@/app/views/OverviewPage";

export default function OverviewRoute() {
  const state = useSharedState();
  return <OverviewPage {...buildPageProps(state)} />;
}