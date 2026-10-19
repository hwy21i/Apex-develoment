"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#FAFAFA] dark:bg-[#000000] p-6">
      <section className="max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF]">
          We couldn’t load the dashboard
        </h1>
        <p className="mt-2 text-sm text-[#666666] dark:text-[#A3A3A3]">
          Check your connection and try again. Your project data has not been changed.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] dark:text-[#000000] transition-colors"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
