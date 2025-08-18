"use client";
import { useState } from "react";

export default function RenditionSelector({
  videoId,
  renditions,
}: {
  videoId: string;
  renditions: string[];
}) {
  const [selectedRendition, setSelectedRendition] = useState(renditions?.[0] || "");

  const handleDownload = () => {
    if (!selectedRendition) return;
    const url = `/api/hls/${videoId}/${selectedRendition}.mp4`;
    window.open(url, "_blank");
  };

  return (
    <section>
      <p className="text-sm opacity-60">Choose a rendition:</p>
      <br />
      <div className="mb-2">
        <select
          value={selectedRendition}
          onChange={(e) => setSelectedRendition(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {renditions?.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {/* <button
        onClick={handleDownload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Download
      </button> */}
    </section>
  );
}