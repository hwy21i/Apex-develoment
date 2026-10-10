/**
 * Client-side CSV export helper.
 *
 * Builds a CSV string from a 2D array of rows (first row is typically the
 * header), escapes values containing commas/quotes/newlines, prepends a UTF-8
 * BOM so Excel renders non-ASCII characters correctly, and triggers a browser
 * download via a Blob + object URL.
 */
export function exportCsv(filename: string, rows: (string | number)[][]): void {
  const escapeCell = (value: string | number): string => {
    const str = String(value ?? "");
    // Always quote cells that contain special characters; double any quotes.
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv = rows
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  // \uFEFF = UTF-8 BOM
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Derives a filesystem-safe slug from a report title, e.g.
 * "Fuel Consumption & Diesel Efficiency" -> "fuel-consumption-diesel-efficiency".
 */
export function csvSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
