import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/Brand";
import { AnalyzeFlow } from "@/components/AnalyzeFlow";

export const metadata: Metadata = { title: "Analyse a property" };

export default function AnalyzePage() {
  return (
    <>
      <SiteHeader />
      <main className="pb-16">
        <Suspense fallback={null}>
          <AnalyzeFlow />
        </Suspense>
      </main>
    </>
  );
}
