export default function HomePage() {
  return (
    <main style={{ padding: "3rem", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>LinkedIn Agent</h1>
      <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
        Project initialized with Next.js web app, Express API, worker service, Postgres, Redis, and Docker Compose.
      </p>
      <p style={{ marginTop: "1rem", opacity: 0.8 }}>
        Next step: implement onboarding, Slack OAuth, instruction profile CRUD, and workflow state transitions.
      </p>
    </main>
  );
}
