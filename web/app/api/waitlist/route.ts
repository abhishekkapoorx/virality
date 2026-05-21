import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string };

  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // Pilot: log server-side until CRM / DB hook exists
  console.info("[waitlist]", { email, at: new Date().toISOString() });

  return NextResponse.json(
    {
      message:
        "You're on the waitlist. We'll email you when pilot access opens."
    },
    { status: 201 }
  );
}
