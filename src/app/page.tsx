import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-md mx-auto pt-24 text-center space-y-4">
      <div className="text-5xl">💳</div>
      <h1 className="text-2xl font-bold">Kids Spending</h1>
      <p className="text-gray-500 text-sm">
        Kids: use the personal link you were texted.
      </p>
      <Link
        href="/parent"
        className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
      >
        Parent Dashboard →
      </Link>
    </div>
  );
}
