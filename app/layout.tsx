import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOV.17 — us, on repeat.",
  description: "一張關於我們的年度混音帶。把喜歡的歌、一起度過的日子，收藏成可以重播的回憶。",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
