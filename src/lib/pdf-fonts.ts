import type { jsPDF } from "jspdf";

const RUBIK_BASE64 = "INSERT_RUBIK_BASE64_HERE";
const JOST_BASE64 = "INSERT_JOST_BASE64_HERE";

export function registerCustomFonts(doc: jsPDF) {
  const pdfDoc = doc as any;

  pdfDoc.addFileToVFS("Rubik-Regular.ttf", RUBIK_BASE64);
  pdfDoc.addFont("Rubik-Regular.ttf", "Rubik", "normal", "normal", "Standard");

  pdfDoc.addFileToVFS("Jost-Regular.ttf", JOST_BASE64);
  pdfDoc.addFont("Jost-Regular.ttf", "Jost", "normal", "normal", "Standard");
}
