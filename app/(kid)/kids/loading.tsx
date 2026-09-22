export default function KidsLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-nest-950 text-white">
      <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
      <div className="mt-6 h-10 w-72 animate-pulse rounded-full bg-white/15" />
      <div className="mt-12 flex gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="size-28 animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
    </div>
  );
}
