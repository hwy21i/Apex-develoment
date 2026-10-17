"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthPage from "../Authpage/authpage";

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEnter = () => {
    const next = searchParams.get("next");
    // Refresh so server components re-read the newly set session cookie.
    router.refresh();
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
  };

  return <AuthPage onEnter={handleEnter} />;
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0B0B] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#111111] dark:border-[#FFFFFF] border-t-transparent animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginScreen />
    </Suspense>
  );
}
