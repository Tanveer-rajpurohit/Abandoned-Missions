import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { SmoothScroll } from "@/components/SmoothScroll";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

// Variable font: one file covers every weight we use (400, 500, 600).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Not on Google Fonts; self-hosted from the v1.143 release (SIL OFL 1.1, see fonts/CommitMono-OFL.txt).
const commitMono = localFont({
  variable: "--font-commit-mono",
  src: "./fonts/CommitMono-400-Regular.ttf",
  weight: "400",
  display: "swap",
});

const SITE_NAME = "Abandoned Missions";
const SITE_DESCRIPTION =
  "The stories of the machines NASA left behind on the Moon, on Mars and in deep space, told by the machines themselves.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE_NAME}: what NASA left behind`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "NASA",
    "Apollo 11",
    "lunar module",
    "Mars rovers",
    "space history",
    "Space Apps Challenge",
    "space for kids",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME}: what NASA left behind`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: what NASA left behind`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efece4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0c" },
  ],
  colorScheme: "light dark",
};

// Runs before first paint so a saved grape or dark choice never flashes paper. Storage can throw in
// private windows; then the page simply stays paper.
const THEME_BOOT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="grape")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${commitMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      {/* Browser extensions (ColorZilla and others) add attributes to <body> before hydration. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
