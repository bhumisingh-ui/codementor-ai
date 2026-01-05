import Link from "next/link";

export default async function TestLoadingPage() {
  // 🛑 Force the server to wait 3 seconds before sending the page
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold text-[#00ff9d] mb-4">
        Loader Test Complete
      </h1>
      <p className="text-gray-400">
        If you are reading this, you just watched the loader for 3 seconds.
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 border border-white/20 rounded hover:bg-white/10 transition"
      >
        Go Home
      </Link>
    </div>
  );
}