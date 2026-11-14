import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
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
  themeColor: "#0b0c0f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${commitMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
