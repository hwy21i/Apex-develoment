/**
 * Apex Developments ERP — PDF Export Utility
 * Triggers genuine, binary PDF generation and direct browser download
 * via the server-side PDFKit report engine (/api/reports/pdf).
 */

export async function downloadReportPdf(
  reportType: string,
  options?: {
    title?: string;
    projectId?: string;
    filename?: string;
  }
): Promise<void> {
  const params = new URLSearchParams();
  params.set("type", reportType);
  if (options?.title) params.set("title", options.title);
  if (options?.projectId) params.set("projectId", options.projectId);

  const url = `/api/reports/pdf?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`PDF generation failed with status ${res.status}`);
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/pdf")) {
      throw new Error(`Expected application/pdf but received ${contentType}`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = options?.filename || `apex-report-${reportType}-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    // Direct browser navigation triggers the Content-Disposition attachment header
    window.location.href = url;
  }
}

