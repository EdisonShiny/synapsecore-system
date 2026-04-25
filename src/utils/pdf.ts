import type { GeneratePhaseReportResult } from "@/types/system";

type PdfLine = {
  text: string;
  fontSize: number;
  gapAfter: number;
};

function normalizePdfText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x20-\x7E]/g, "?");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maxCharacters: number) {
  const normalized = normalizePdfText(value).trim();

  if (!normalized) {
    return [""];
  }

  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxCharacters) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (word.length <= maxCharacters) {
      currentLine = word;
      continue;
    }

    let remainder = word;

    while (remainder.length > maxCharacters) {
      lines.push(remainder.slice(0, maxCharacters - 1) + "-");
      remainder = remainder.slice(maxCharacters - 1);
    }

    currentLine = remainder;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function buildPhaseReportLines(args: {
  result: GeneratePhaseReportResult;
  projectSubject: string;
}) {
  const lines: PdfLine[] = [
    {
      text: "Phase Report",
      fontSize: 18,
      gapAfter: 10
    },
    {
      text: `Project: ${args.projectSubject}`,
      fontSize: 11,
      gapAfter: 4
    },
    {
      text: `Phase: ${args.result.phaseTitle}`,
      fontSize: 11,
      gapAfter: 4
    },
    {
      text: `Generated: ${new Date(args.result.generatedAt).toLocaleString("en-US")}`,
      fontSize: 11,
      gapAfter: 12
    }
  ];

  const paragraphs = normalizePdfText(args.result.report).split("\n");

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      lines.push({
        text: "",
        fontSize: 10,
        gapAfter: 8
      });
      continue;
    }

    for (const wrappedLine of wrapText(trimmed, 92)) {
      lines.push({
        text: wrappedLine,
        fontSize: 10,
        gapAfter: 4
      });
    }

    lines.push({
      text: "",
      fontSize: 10,
      gapAfter: 8
    });
  }

  return lines;
}

function buildPdfContent(pages: Array<Array<{ text: string; fontSize: number; y: number }>>) {
  return pages.map((pageLines) =>
    pageLines
      .map((line) => {
        const escaped = escapePdfText(line.text);
        return `BT\n/F1 ${line.fontSize} Tf\n1 0 0 1 48 ${line.y} Tm\n(${escaped}) Tj\nET`;
      })
      .join("\n")
  );
}

function paginateLines(lines: PdfLine[]) {
  const pages: Array<Array<{ text: string; fontSize: number; y: number }>> = [];
  let currentPage: Array<{ text: string; fontSize: number; y: number }> = [];
  let y = 794;
  const bottomMargin = 52;

  for (const line of lines) {
    const lineHeight = line.text ? line.fontSize + line.gapAfter : line.gapAfter;

    if (y - lineHeight < bottomMargin) {
      pages.push(currentPage);
      currentPage = [];
      y = 794;
    }

    if (line.text) {
      currentPage.push({
        text: line.text,
        fontSize: line.fontSize,
        y
      });
    }

    y -= lineHeight;
  }

  if (currentPage.length > 0 || pages.length === 0) {
    pages.push(currentPage);
  }

  return pages;
}

export function buildPhaseReportPdf(args: {
  result: GeneratePhaseReportResult;
  projectSubject: string;
}) {
  const lines = buildPhaseReportLines(args);
  const pageCommands = buildPdfContent(paginateLines(lines));
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  const pageReferences: number[] = [];

  for (const pageCommand of pageCommands) {
    const contentStream = `<< /Length ${pageCommand.length} >>\nstream\n${pageCommand}\nendstream`;
    const contentId = objects.push(contentStream);
    const pageId = objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
    );

    pageReferences.push(pageId);
  }

  objects[1] = `<< /Type /Pages /Count ${pageReferences.length} /Kids [${pageReferences.map((id) => `${id} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function buildPhaseReportPdfFileName(projectSubject: string, phaseTitle: string) {
  const slug = `${projectSubject}-${phaseTitle}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${slug || "phase-report"}.pdf`;
}
