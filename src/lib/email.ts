import { Resend } from 'resend';



export async function sendEmail(to: string, content: any) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not defined in environment variables. Email will not be sent.");
    throw new Error("RESEND_API_KEY is not defined");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  let htmlContent = "";

  if (content.html_report) {
    htmlContent = content.html_report;
  } else {
    htmlContent = `
    <h1>${content.title || "Weekly Pulse Report"}</h1>
    <p>${content.overview}</p>
    
    <h2>Top Themes</h2>
    <ul>
      ${Array.isArray(content.top_themes)
        ? content.top_themes.map((t: string) => `<li>${t}</li>`).join("")
        : `<li>${content.top_themes}</li>`}
    </ul>

    <h2>User Quotes</h2>
    <ul>
      ${Array.isArray(content.user_quotes)
        ? content.user_quotes.map((q: string) => `<li>"${q}"</li>`).join("")
        : `<li>${content.user_quotes}</li>`}
    </ul>

    <h2>Action Ideas</h2>
    <ul>
      ${Array.isArray(content.action_ideas)
        ? content.action_ideas.map((a: string) => `<li>${a}</li>`).join("")
        : `<li>${content.action_ideas}</li>`}
    </ul>
  `;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Weekly Pulse <hello@mail.uiuxanjali.com>',
    to: [to],
    subject: 'Weekly Pulse: IND Money',
    html: htmlContent,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}
