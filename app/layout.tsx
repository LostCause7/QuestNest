import type { Metadata, Viewport } from "next";
import { Inter, Fredoka, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SkipLink } from "@/components/shared/skip-link";
import { getSiteUrl } from "@/lib/site-url";
import { getSupabaseEnv, supabaseEnvBootstrapScript } from "@/lib/supabase/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "QuestNest — Chores become quests. Kids actually want to do.",
    template: "%s | QuestNest",
  },
  description:
    "QuestNest turns chores into quests, points into rewards, and nagging into high-fives. Parents customize everything; kids pick their avatar, enter a PIN, and start earning.",
  keywords: [
    "chore app for kids",
    "kids reward chart",
    "chore tracker",
    "allowance app",
    "family chores",
    "points and rewards for kids",
  ],
  openGraph: {
    type: "website",
    siteName: "QuestNest",
    title: "QuestNest — Chores become quests. Kids actually want to do.",
    description:
      "Turn chores into quests, points into rewards, and nagging into high-fives. No extra app download.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "QuestNest — Chores become quests. Kids actually want to do.",
    description:
      "Turn chores into quests, points into rewards, and nagging into high-fives. No extra app download.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b3fd1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const supabaseEnv = getSupabaseEnv();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fredoka.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {supabaseEnv ? (
          <script
            dangerouslySetInnerHTML={{ __html: supabaseEnvBootstrapScript(supabaseEnv) }}
          />
        ) : null}
        <SkipLink />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
