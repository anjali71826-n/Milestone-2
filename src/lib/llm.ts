import { GoogleGenerativeAI } from "@google/generative-ai";
import { Review } from "./scraper";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function groupReviews(reviews: Review[]) {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-lite-latest" });

    const themes = [
        "Onboarding",
        "KYC",
        "Payments",
        "Statements",
        "Withdrawals",
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
      - chosen_theme (exactly one from list, or "Other" if none fit)
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
        if (r.chosen_theme && r.chosen_theme !== "Other") {
            themeCounts[r.chosen_theme] = (themeCounts[r.chosen_theme] || 0) + 1;
        }
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
    Output as JSON with keys: title, overview, top_themes (array of strings), user_quotes (array of strings), action_ideas (array of strings).
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "");
    const data = JSON.parse(jsonStr);

    // Generate Strict HTML Report
    const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; }
            h1 { color: #2c3e50; }
            h2 { color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; margin-top: 30px; }
            .overview { background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin-bottom: 20px; }
            .quote { font-style: italic; color: #555; border-left: 3px solid #27ae60; padding-left: 10px; margin: 10px 0; }
            .action-item { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>${data.title}</h1>
        
        <div class="overview">
            <h3>Overview</h3>
            <p>${data.overview}</p>
        </div>

        <h2>Top 3 Themes</h2>
        <ul>
            ${data.top_themes.map((t: string) => `<li><strong>${t}</strong></li>`).join("")}
        </ul>

        <h2>User Quotes</h2>
        ${data.user_quotes.map((q: string) => `<div class="quote">"${q}"</div>`).join("")}

        <h2>Action Ideas</h2>
        ${data.action_ideas.map((a: string) => `<div class="action-item">💡 ${a}</div>`).join("")}
    </body>
    </html>
    `;

    // Generate Markdown Report
    const markdownReport = `
# ${data.title}

## Overview
${data.overview}

## Top 3 Themes
${data.top_themes.map((t: string) => `- **${t}**`).join("\n")}

## User Quotes
${data.user_quotes.map((q: string) => `> "${q}"`).join("\n")}

## Action Ideas
${data.action_ideas.map((a: string) => `- 💡 ${a}`).join("\n")}
    `.trim();

    return {
        ...data,
        html_report: htmlReport,
        markdown_report: markdownReport
    };
}
