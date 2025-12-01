import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, pulse } = body;

        if (!email || !pulse) {
            return NextResponse.json(
                { error: "Email and pulse data are required" },
                { status: 400 }
            );
        }

        await sendEmail(email, pulse);

        return NextResponse.json({ message: "Email sent successfully" });
    } catch (error: any) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: "Failed to send email", details: error.message },
            { status: 500 }
        );
    }
}
