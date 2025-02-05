import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

interface Commit {
  hash: string;
  author_name: string;
  date: string;
  message: string;
}

interface ExportRequest {
  commits: Commit[];
  format: "pdf" | "csv";
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { commits, format }: ExportRequest = await req.json();

    if (!commits || commits.length === 0) {
      return NextResponse.json(
        { error: "No commits found to export." },
        { status: 400 }
      );
    }

    if (!format || (format !== "pdf" && format !== "csv")) {
      return NextResponse.json(
        { error: "Invalid format. Use 'pdf' or 'csv'." },
        { status: 400 }
      );
    }

    if (format === "pdf") {
      return generatePDF(commits);
    } else if (format === "csv") {
      return generateCSV(commits);
    }

    return NextResponse.json(
      { error: "Unknown error occurred." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generatePDF(commits: Commit[]): Response {
  try {
    const fontPath = path.join(
      process.cwd(),
      "public/fonts/Roboto-Regular.ttf"
    ); // ✅ Use a local font
    if (!fs.existsSync(fontPath)) {
      console.error("Font file missing:", fontPath);
      return NextResponse.json(
        {
          error:
            "Font file not found. Please add Roboto-Regular.ttf to public/fonts",
        },
        { status: 500 }
      );
    }

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=report.pdf",
        },
      });
    });

    doc.font(fontPath); // ✅ Use custom font to prevent Helvetica error
    doc.fontSize(18).text("Git Commit Report", { align: "center" }).moveDown();
    commits.forEach((c, i) =>
      doc.text(`${i + 1}. ${c.author_name} - ${c.date}\n${c.message}\n`, {
        underline: true,
      })
    );
    doc.end();

    return new Response("PDF generation started", { status: 200 });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function generateCSV(commits: Commit[]): Response {
  try {
    const csv = commits
      .map((c) => `${c.hash},${c.author_name},${c.date},${c.message}`)
      .join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=report.csv",
      },
    });
  } catch (error) {
    console.error("CSV Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV" },
      { status: 500 }
    );
  }
}
