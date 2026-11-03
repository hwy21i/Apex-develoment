/**
 * Apex Developments ERP — PDF Export Utility
 * Triggers genuine, binary PDF generation and direct browser download
 * via the server-side enterprise report engine (/api/reports/pdf).
 */

export interface DownloadPdfOptions {
  title?: string;
  projectId?: string;
  filename?: string;
  onStart?: () => void;
  onSuccess?: (filename: string) => void;
  onError?: (errorMessage: string) => void;
}

export async function downloadReportPdf(
  reportType: string,
  options?: DownloadPdfOptions
): Promise<{ success: boolean; filename?: string; error?: string }> {
  options?.onStart?.();

  const params = new URLSearchParams();
  params.set("type", reportType);
  if (options?.title) params.set("title", options.title);
  if (options?.projectId) params.set("projectId", options.projectId);

  const url = `/api/reports/pdf?${params.toString()}`;
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultFilename = `Apex_${reportType.replace(/[^a-zA-Z0-9_-]/g, "_")}_${todayStr}.pdf`;
  const targetFilename = options?.filename || defaultFilename;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!res.ok) {
      let errDetail = `Status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) errDetail = errJson.error.message;
      } catch {
        // Not JSON
      }
      throw new Error(`PDF generation failed: ${errDetail}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) {
      throw new Error(`Invalid response format (expected application/pdf, got ${contentType})`);
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error("Generated PDF file was empty (0 bytes)");
    }

    // Trigger direct browser download
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = targetFilename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 1200);

    options?.onSuccess?.(targetFilename);
    return { success: true, filename: targetFilename };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to download PDF document";
    options?.onError?.(errorMsg);
    return { success: false, error: errorMsg };
  }
}
