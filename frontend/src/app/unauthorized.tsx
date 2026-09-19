import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="clicks-shell flex min-h-screen items-center justify-center p-6">
      <div className="rounded-xl border border-[#E7EAF1] bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">Sign in required</h1>
        <p className="mt-2 text-sm text-[#616674]">You need an admin session to continue.</p>
        <Link href="/admin/login" className="mt-4 inline-flex text-sm font-semibold text-[#0040FD]">Go to admin login</Link>
      </div>
    </div>
  );
}
