import { NextResponse } from "next/server";
import simpleGit from "simple-git";

interface Commit {
  hash: string;
  author_name: string;
  date: string;
  message: string;
}

export async function POST(req: Request) {
  try {
    const {
      repoPaths,
      startDate,
      endDate,
    }: { repoPaths: string[]; startDate: string; endDate: string } =
      await req.json();

    if (!repoPaths || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const reports: { repo: string; commits: Commit[] }[] = [];

    for (const path of repoPaths) {
      const git = simpleGit({ baseDir: path });

      try {
        console.log(`Checking repo at: ${path}`);
        await git.raw(["rev-parse", "--is-inside-work-tree"]); // Ensure it's a valid repo

        // ✅ Correct usage of --since and --until
        const logOutput = await git.raw([
          "log",
          "--pretty=format:%H|%an|%ad|%s", // Custom format: hash|author|date|message
          "--since=" + startDate,
          "--until=" + endDate,
        ]);

        // ✅ Parse the log output manually
        const commits = logOutput
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [hash, author_name, date, message] = line.split("|");
            return { hash, author_name, date, message };
          });

        reports.push({ repo: path, commits });
      } catch (error) {
        console.error(`Error reading repo: ${path}`, error);
        return NextResponse.json(
          { error: `Failed to read repo: ${path}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
