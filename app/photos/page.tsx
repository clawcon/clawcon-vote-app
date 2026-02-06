export const metadata = {
  title: "Photos & Videos – Claw Con",
};

const sfPhotos = [
  "https://raysurfercdn.com/claw-con/RAY02545.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02547.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02549.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02550.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02551.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02552.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02553.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02554.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02557.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02559.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02563.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02564.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02565.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02566.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02567.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02568.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02569.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02572.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02576.webp?v=1770287316279",
  "https://raysurfercdn.com/claw-con/RAY02577.webp?v=1770287316279",
];

// Placeholder: add mp4 URLs here as we collect them.
const sfVideos: string[] = [];

function MediaGrid({ urls }: { urls: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* Using plain img to avoid next/image remote host config */}
          <img
            src={url}
            alt="Claw Con photo"
            loading="lazy"
            style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
          />
        </a>
      ))}
    </div>
  );
}

export default function PhotosPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Photos & Videos</h1>
      <p style={{ marginBottom: 24, color: "#4b5563" }}>
        SF photos sourced from{" "}
        <a href="https://www.raysurfer.com/blog/claw-con" target="_blank" rel="noreferrer">
          raysurfer.com/blog/claw-con
        </a>
        .
      </p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Claw Con SF</h2>
        <MediaGrid urls={sfPhotos} />
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Videos</h2>
        {sfVideos.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No videos added yet.</p>
        ) : (
          <ul>
            {sfVideos.map((v) => (
              <li key={v}>
                <a href={v} target="_blank" rel="noreferrer">
                  {v}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
