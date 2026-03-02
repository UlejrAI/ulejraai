// Financial Agent Dashboard — embeds OpenClaw Mission Control frontend.
// URL is configured via AGENT_DASHBOARD_URL env var (server-side),
// defaulting to the openclaw-frontend Cloud Run service.
const BASE_URL =
  process.env.AGENT_DASHBOARD_URL ??
  "https://openclaw-frontend-481969206534.europe-west1.run.app";

// Open directly on the boards dashboard (skips the landing page after login)
const DASHBOARD_URL = `${BASE_URL.replace(/\/$/, "")}/dashboard`;

export default function AgentDashboardPage() {
  return (
    <div className="flex flex-1 rounded-[inherit]">
      <iframe
        className="h-full w-full"
        src={DASHBOARD_URL}
        title="Financial Agent Dashboard"
        allow="clipboard-write"
      />
    </div>
  );
}
