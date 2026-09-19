export default function ForbiddenPage() {
  return (
    <div className="clicks-shell flex min-h-screen items-center justify-center p-6">
      <div className="rounded-xl border border-[#E7EAF1] bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">Forbidden</h1>
        <p className="mt-2 text-sm text-[#616674]">Your role cannot perform this action.</p>
      </div>
    </div>
  );
}
