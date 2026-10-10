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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
