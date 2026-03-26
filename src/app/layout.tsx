import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";

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
      <body className="antialiased flex">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-auto">
          <div className="px-8 pt-6">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
