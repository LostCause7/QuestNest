import { requireFamily } from "@/lib/data/family";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children }: LayoutProps<"/kids">) {
  await requireFamily();
  return (
    <div className="kid-mode relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      {/* playful background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-sun-400/70 blur-3xl" />
        <div className="absolute top-1/3 -right-32 size-[28rem] rounded-full bg-nest-300/70 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 size-[26rem] rounded-full bg-mint-400/60 blur-3xl" />
      </div>
      {children}
    </div>
  );
}
