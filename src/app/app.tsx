"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "~/components/ErrorBoundary";

const Demo = dynamic(() => import("~/components/Demo"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-900">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-white rounded-full animate-spin mb-4" />
      <p className="text-white text-xl">Loading POD Play...</p>
    </div>
  ),
});

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-purple-900">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-white rounded-full animate-spin" />
          </div>
        }
      >
        <Demo />
      </Suspense>
    </ErrorBoundary>
  );
}