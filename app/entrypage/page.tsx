"use client";

import { useRouter } from "next/navigation";
import EntryPage from "./entrypage";

export default function Page() {
  const router = useRouter();

  return <EntryPage onEnter={() => router.push("/")} />;
}
