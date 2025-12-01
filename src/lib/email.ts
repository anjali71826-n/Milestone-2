import nodemailer from "nodemailer";

export async function sendEmail(to: string, content: any) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
    debug: true, // show debug output
    logger: true, // log information in console
    tls: {
      rejectUnauthorized: false, // do not fail on invalid certs
    },
  } as nodemailer.TransportOptions);

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

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: to,
    subject: `Weekly Pulse: IND Money`,
    html: htmlContent,
  });

  return info;
}
