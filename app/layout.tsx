import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HardStop Terminal",
  description: "Real-time market context — trend, regime, conviction.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
