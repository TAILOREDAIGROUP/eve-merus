import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EVE Merus — AI Skills Library Optimizer",
  description:
    "Continuously improve accuracy and performance of AI skills, prompts, and agent systems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
