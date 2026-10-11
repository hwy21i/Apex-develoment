"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthPage from "../Authpage/authpage";

function LoginScreen() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = () => {
    const next = searchParams.get("next");
    // Refresh so server components re-read the newly set session cookie.
    router.refresh();
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
  };

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        className="min-h-screen bg-[#1A2D42] flex items-center justify-center"
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#C0C8CA] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <AuthPage onEnter={handleEnter} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
