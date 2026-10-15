"use client";

import { useRouter } from "next/navigation";
import EntryPage from "./entrypage";

/** Legacy /entrypage route — same entry presentation, pushes to /login on enter. */
export default function Page() {
  const router = useRouter();
  return <EntryPage onEnter={() => router.push("/login")} />;
}
