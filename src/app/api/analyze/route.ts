import { NextResponse } from "next/server";
import { fetchReviews } from "@/lib/scraper";
import { groupReviews, generateWeeklyPulse } from "@/lib/llm";
import { sendEmail } from "@/lib/email";
import fs from "fs";
import path from "path";

export async function POST() {
    try {
        // 1. Fetch Reviews
        const reviews = await fetchReviews();
        if (reviews.length === 0) {
            return NextResponse.json({ message: "No reviews found" }, { status: 404 });
        }

        // 2. Group Reviews
        const groupedReviews = await groupReviews(reviews);

        // 3. Generate Pulse
        const pulse = await generateWeeklyPulse(reviews, groupedReviews);

        // 4. Save Artifacts
        const outputDir = path.join(process.cwd(), "public", "output");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save Reviews CSV
        const csvHeader = "id,date,source,score,title,text\n";
        const csvRows = reviews.map(r => {
            const cleanText = r.text.replace(/"/g, '""').replace(/\n/g, " ");
            const cleanTitle = r.title ? r.title.replace(/"/g, '""').replace(/\n/g, " ") : "";
            return `"${r.id}","${r.date}","${r.source}",${r.score},"${cleanTitle}","${cleanText}"`;
        }).join("\n");
        fs.writeFileSync(path.join(outputDir, "reviews.csv"), csvHeader + csvRows);

        // Save Weekly Note MD
        if (pulse.markdown_report) {
            fs.writeFileSync(path.join(outputDir, "weekly_note.md"), pulse.markdown_report);
        }

        // 5. Send Email (commented out - displaying on UI instead)
        // await sendEmail(pulse);

        return NextResponse.json({
            message: "Analysis complete",
            pulse: pulse,
            reviewsCount: reviews.length,
            groupedReviewsCount: groupedReviews.length,
        });
    } catch (error: any) {
        console.error("Analysis failed:", error);
        return NextResponse.json(
            { error: "Analysis failed", details: error.message },
            { status: 500 }
        );
    }
}
