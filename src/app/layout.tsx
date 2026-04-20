import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Japanese News Learning Platform",
  description: "Learn Japanese through the latest news with furigana and Korean translation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
