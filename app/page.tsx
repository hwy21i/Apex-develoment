"use client";

import { useRouter } from "next/navigation";
import EntryPage from "./entrypage/entrypage";

/**
 * Root route — the FIRST page shown on every fresh session.
 *
 * This is a pure presentation/marketing landing page.
 * Clicking "Enter Dashboard" or "Open Dashboard" navigates to /login
 * (if not yet authenticated) or /dashboard (if a valid session exists).
 * The edge proxy (proxy.ts) does NOT redirect / for authenticated users —
 * they must explicitly choose to enter.
 */
export default function Home() {
  const router = useRouter();

  const handleEnter = () => {
    router.push("/login");
  };

  return <EntryPage onEnter={handleEnter} />;
}
