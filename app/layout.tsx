import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Behind the Mystery | A different way to see the story",
  description:
    "Strange situations. Small questions. Unexpected truths. An interactive collection of lateral-thinking mysteries.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
