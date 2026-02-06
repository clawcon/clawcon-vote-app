import { Suspense } from "react";
import RobotsClient from "./robots-client";

export const metadata = {
  title: "Robots – Claw Con",
  description: "Robots and makers attending Claw Con.",
};

export default function RobotsPage() {
  return (
    <Suspense fallback={null}>
      <RobotsClient />
    </Suspense>
  );
}
