import "./globals.css";
import { Suspense } from "react";
import AppShell from "./_shared/app-shell";

export const metadata = {
  title: "ClawdCon – Submit & Vote",
  description: "Submit and vote on demos and topics for ClawdCon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
