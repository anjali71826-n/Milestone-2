import { NextResponse } from "next/server";
import { fetchReviews } from "@/lib/scraper";
import { groupReviews, generateWeeklyPulse } from "@/lib/llm";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 1. Fetch Reviews
        const reviews = await fetchReviews();
        if (reviews.length === 0) {
            return NextResponse.json({ message: "No reviews found" });
        }

        // 2. Group Reviews
        const groupedReviews = await groupReviews(reviews);

        // 3. Generate Pulse
        const pulse = await generateWeeklyPulse(reviews, groupedReviews);

        // 4. Send Email
        // Hardcoded email for now as per previous context, or could be env var
        const recipientEmail = process.env.REPORT_RECIPIENT_EMAIL || 'hello@mail.uiuxanjali.com';
        await sendEmail(recipientEmail, pulse);

        return NextResponse.json({
            message: "Weekly pulse generated and sent",
            pulse: pulse,
        });
    } catch (error: any) {
        console.error("Weekly pulse cron failed:", error);
        return NextResponse.json(
            { error: "Weekly pulse cron failed", details: error.message },
            { status: 500 }
        );
    }
}
