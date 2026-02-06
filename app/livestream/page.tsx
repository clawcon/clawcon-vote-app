import { Suspense } from "react";
import LivestreamClient from "./livestream-client";

export const metadata = {
  title: "Livestream – Claw Con",
};

export default function LivestreamPage() {
  return (
    <Suspense fallback={null}>
      <LivestreamClient />
    </Suspense>
  );
}
