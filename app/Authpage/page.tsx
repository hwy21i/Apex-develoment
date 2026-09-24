"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AuthPage from "./authpage";

export default function Page() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  return (
    <AuthPage
      onEnter={async () => {
        await refreshUser();
        router.push("/");
      }}
    />
  );
}
