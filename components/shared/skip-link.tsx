export function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      className="qn-skip sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
    >
      Skip to content
    </a>
  );
}
