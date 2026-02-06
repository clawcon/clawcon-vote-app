import { Suspense } from "react";
import PhotosClient from "./photos-client";

export const metadata = {
  title: "Photos & Videos – Claw Con",
};

export default function PhotosPage() {
  return (
    <Suspense fallback={null}>
      <PhotosClient />
    </Suspense>
  );
}
