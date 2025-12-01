import { NextResponse } from "next/server";
import { fetchReviews } from "@/lib/scraper";
import { groupReviews, generateWeeklyPulse } from "@/lib/llm";
import { sendEmail } from "@/lib/email";

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

        // 4. Send Email (commented out - displaying on UI instead)
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
