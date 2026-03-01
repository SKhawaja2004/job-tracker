export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-3xl font-semibold">Job Tracker</h1>
      <p className="text-muted-foreground">
        Track applications, stages, and outcomes. Workspace-ready for friends,
        unis, or agencies.
      </p>

      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <a href="/" className="font-semibold">
            Job Tracker
          </a>
          <div className="flex gap-4 text-sm">
            <a className="hover:underline" href="/app">
              App
            </a>
            <a className="hover:underline" href="/docs">
              Docs
            </a>
          </div>
        </nav>
      </header>

      <div className="flex gap-3">
        <a
          href="/app"
          className="rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          Go to app
        </a>
        <a href="/docs" className="rounded-md border px-4 py-2 text-sm">
          Docs
        </a>
      </div>
    </main>
  );
}
