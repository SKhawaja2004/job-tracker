export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-4xl font-bold">Job Tracker</h1>
      <p className="text-gray-600">
        A workspace-ready job application tracker for individuals, friends, and
        universities.
      </p>

      <a
        href="/dashboard"
        className="inline-block rounded-md bg-black px-5 py-2 text-white"
      >
        Go to Dashboard
      </a>
    </main>
  );
}
