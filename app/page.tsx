import { redirect } from "next/navigation";

// The legacy client SPA (app.tsx/workspace.tsx) was removed. The root route now
// defers to the session-backed App Router app; `proxy.ts` bounces unauthenticated
// visitors to /login before this runs.
export default function Page() {
  redirect("/dashboard");
}
