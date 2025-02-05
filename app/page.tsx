"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Commit {
  author_name: string;
  date: string;
  message: string;
  hash: string;
}

export default function Home() {
  const [repoPaths, setRepoPaths] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [commits, setCommits] = useState<Commit[]>([]);

  const analyzeCommits = async () => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoPaths: repoPaths.split(","),
          startDate,
          endDate,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch commits");

      const data: { repo: string; commits: Commit[] }[] = await response.json();
      setCommits(data.flatMap((r) => r.commits));
      toast.success("Commit data fetched!");
    } catch {
      toast.error("Error fetching commits!");
    }
  };

  const exportReport = async (format: "pdf" | "csv") => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commits, format }),
      });

      if (!response.ok) throw new Error("Failed to export report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report.${format}`);
      document.body.appendChild(link);
      link.click();
    } catch {
      toast.error("Error exporting report!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-10">
      <h1 className="text-3xl font-bold">Git Commit Report Generator</h1>

      <input
        className="border p-2 w-full mt-4"
        type="text"
        placeholder="Enter repo paths (comma-separated)"
        value={repoPaths}
        onChange={(e) => setRepoPaths(e.target.value)}
      />

      <div className="flex gap-4 mt-4">
        <input
          className="border p-2 w-full"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <button
        onClick={analyzeCommits}
        className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
      >
        Analyze Commits
      </button>

      {commits.length > 0 && (
        <>
          <div className="mt-4 border p-4 bg-gray-100">
            <h2 className="text-lg font-semibold">Commit Data</h2>
            {commits.map((commit, i) => (
              <p key={i} className="text-sm">
                {commit.author_name} - {commit.message}
              </p>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => exportReport("pdf")}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Export PDF
            </button>

            <button
              onClick={() => exportReport("csv")}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Export CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
