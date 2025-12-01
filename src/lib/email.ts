import nodemailer from "nodemailer";

export async function sendEmail(to: string, content: any) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for SSL (465), false for TLS (587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const htmlContent = `
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

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: to,
    subject: `Weekly Pulse: IND Money`,
    html: htmlContent,
  });

  return info;
}
