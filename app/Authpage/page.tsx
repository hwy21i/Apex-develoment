"use client";

import { useRouter } from "next/navigation";
import AuthPage from "./authpage";

export default function Page() {
  const router = useRouter();

  return <AuthPage onEnter={() => router.push("/")} />;
}
