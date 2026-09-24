import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SkipLink } from "@/components/shared/skip-link";
import { IosTapBridge } from "@/components/shared/ios-tap-bridge";
import { getSiteUrl } from "@/lib/site-url";
import { getSupabaseEnv, supabaseEnvBootstrapScript } from "@/lib/supabase/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    default: "ChoreHall — Chores become quests. Kids actually want to do.",
    template: "%s | ChoreHall",
  },
  description:
    "ChoreHall turns chores into quests, points into rewards, and nagging into high-fives. Parents customize everything; kids pick their avatar, enter a PIN, and start earning.",
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
    siteName: "ChoreHall",
    title: "ChoreHall — Chores become quests. Kids actually want to do.",
    description:
      "Turn chores into quests, points into rewards, and nagging into high-fives. No extra app download.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "ChoreHall — Chores become quests. Kids actually want to do.",
    description:
      "Turn chores into quests, points into rewards, and nagging into high-fives. No extra app download.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#15202b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const supabaseEnv = getSupabaseEnv();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body{background:#15202b;color:#e8eef4;margin:0}img{max-width:100%}.qn-backdrop{pointer-events:none!important}[data-slot=dialog-overlay][data-closed],[data-slot=sheet-overlay][data-closed]{display:none!important;pointer-events:none!important}button,a,[role=button],label,summary,input,textarea,select{pointer-events:auto;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:rgba(125,211,252,.35)}.qn-skip{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.qn-skip:focus{width:auto;height:auto;clip:auto;overflow:visible}",
          }}
        />
        {supabaseEnv ? (
          <script
            dangerouslySetInnerHTML={{ __html: supabaseEnvBootstrapScript(supabaseEnv) }}
          />
        ) : null}
        <SkipLink />
        <IosTapBridge />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
