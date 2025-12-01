import { fetchReviews } from "@/lib/scraper";
import { groupReviews, generateWeeklyPulse } from "@/lib/llm";

export async function GET() {
    const encoder = new TextEncoder();

    const customReadable = new ReadableStream({
        async start(controller) {
            try {
                // Helper to send progress updates
                const sendProgress = (step: string, message: string, data?: any) => {
                    const progressData = JSON.stringify({ step, message, data });
                    controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                };

                // Step 1: Fetch Reviews
                sendProgress("fetching", "Fetching reviews from App Store and Play Store...");
                const reviews = await fetchReviews();

                if (reviews.length === 0) {
                    sendProgress("error", "No reviews found");
                    controller.close();
                    return;
                }

                sendProgress("fetched", `Found ${reviews.length} reviews`, { count: reviews.length, reviews });

                // Step 2: Group Reviews
                sendProgress("grouping", "Grouping reviews into themes using AI...");
                const groupedReviews = await groupReviews(reviews);
                sendProgress("grouped", `Grouped ${groupedReviews.length} reviews`, { count: groupedReviews.length });

                // Step 3: Generate Pulse
                sendProgress("generating", "Generating weekly pulse report...");
                const pulse = await generateWeeklyPulse(reviews, groupedReviews);
                sendProgress("complete", "Analysis complete!", {
                    pulse,
                    reviews,
                    reviewsCount: reviews.length,
                    groupedReviewsCount: groupedReviews.length,
                });

                controller.close();
            } catch (error: any) {
                const errorData = JSON.stringify({
                    step: "error",
                    message: `Analysis failed: ${error.message}`,
                });
                controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(customReadable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
