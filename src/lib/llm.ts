import { GoogleGenerativeAI } from "@google/generative-ai";
import { Review } from "./scraper";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function groupReviews(reviews: Review[]) {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-lite-latest" });

    const themes = [
        "US Stocks",
        "Onboarding & KYC",
        "Deposits & Withdrawals",
        "Portfolio Tracking",
        "App Experience",
    ];

    // Process in batches to avoid context limit
    const batchSize = 20;
    const groupedReviews: any[] = [];

    for (let i = 0; i < reviews.length; i += batchSize) {
        const batch = reviews.slice(i, i + batchSize);
        const prompt = `
      You are tagging fintech app reviews for IND Money into at most 5 fixed themes.
      Allowed themes: ${themes.join(", ")}

      Reviews:
      ${JSON.stringify(
            batch.map((r) => ({ id: r.id, text: r.text })),
            null,
            2
        )}

      For each review, output a JSON array of objects with:
      - review_id
      - chosen_theme (exactly one from list)
      - short_reason
    `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "");
            const batchResult = JSON.parse(jsonStr);
            groupedReviews.push(...batchResult);
        } catch (error) {
            console.error("Error grouping reviews batch:", error);
        }
    }

    return groupedReviews;
}

export async function generateWeeklyPulse(
    reviews: Review[],
    groupedReviews: any[]
) {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-lite-latest" });

    // 1. Count themes
    const themeCounts: Record<string, number> = {};
    groupedReviews.forEach((r) => {
        themeCounts[r.chosen_theme] = (themeCounts[r.chosen_theme] || 0) + 1;
    });

    const topThemes = Object.entries(themeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([theme]) => theme);

    // 2. Get reviews for top themes
    const topReviews = reviews.filter((r) => {
        const group = groupedReviews.find((g) => g.review_id === r.id);
        return group && topThemes.includes(group.chosen_theme);
    });

    // 3. Generate Pulse
    const prompt = `
    You are creating a weekly product pulse for IND Money leadership.
    
    Top 3 Themes: ${topThemes.join(", ")}
    
    Reviews for these themes:
    ${JSON.stringify(
        topReviews.map((r) => ({ text: r.text, theme: groupedReviews.find(g => g.review_id === r.id)?.chosen_theme })),
        null,
        2
    )}

    Tasks:
    1. Create a short title.
    2. Write a 60-word overview.
    3. Bullet points for Top 3 themes.
    4. Select 3 vivid user quotes (Anonymized).
    5. Suggest 3 specific action ideas.

    Constraint: Total length ≤ 250 words. Professional, objective tone.
    Output as JSON.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "");
    return JSON.parse(jsonStr);
}
