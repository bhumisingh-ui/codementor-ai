import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-5xl font-bold">CodeMentor AI</h1>
      <p className="mt-4 text-gray-600 text-lg">
        AI-powered code review & learning platform
      </p>
      <Link
        href="/editor"
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Start Coding →
      </Link>
    </main>
  );
}
