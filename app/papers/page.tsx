import { Suspense } from "react";
import PapersClient from "./papers-client";

export const metadata = {
  title: "Papers – Claw Con",
  description: "Whitepapers and research shared by Claw Con attendees.",
};

export default function PapersPage() {
  return (
    <Suspense fallback={null}>
      <PapersClient />
    </Suspense>
  );
}
