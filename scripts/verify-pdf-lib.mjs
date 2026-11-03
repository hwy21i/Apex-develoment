import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";

console.log("Testing pdf-lib creation...");
const doc = await PDFDocument.create();
const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

const page = doc.addPage([595.28, 841.89]); // A4
const { width, height } = page.getSize();

// Header bar
page.drawRectangle({
  x: 36,
  y: height - 92,
  width: width - 72,
  height: 56,
  color: rgb(0, 0, 0),
});

page.drawText("APEX DEVELOPMENTS", {
  x: 50,
  y: height - 60,
  size: 16,
  font: fontBold,
  color: rgb(1, 1, 1),
});

page.drawText("Enterprise Construction Project Management ERP", {
  x: 50,
  y: height - 76,
  size: 9,
  font: fontRegular,
  color: rgb(0.85, 0.85, 0.85),
});

const pdfBytes = await doc.save();
console.log(`Generated valid PDF: ${pdfBytes.length} bytes`);
fs.writeFileSync("./construction-progect-mangegment/tests/verify-pdf-lib.pdf", pdfBytes);

const magic = Buffer.from(pdfBytes.subarray(0, 5)).toString("utf-8");
console.log(`Magic: ${magic}`);
if (magic === "%PDF-") {
  console.log("SUCCESS: Valid PDF binary confirmed!");
} else {
  console.error("FAIL: Invalid PDF magic header");
  process.exit(1);
}
