import { Suspense } from "react";
import SponsorsClient from "./sponsors-client";

export const metadata = {
  title: "Sponsors – Claw Con",
  description: "Sponsors and how to sponsor Claw Con.",
};

export default function SponsorsPage() {
  return (
    <Suspense fallback={null}>
      <SponsorsClient />
    </Suspense>
  );
}
