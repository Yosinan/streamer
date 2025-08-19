"use client";
import { useState } from "react";
import VideoPlayerWrapper from "@/components/VideoPlayerWrapper";

export default function VideoPlayerWithRendition({
  videoId,
  renditions,
  defaultUrl,
}: {
  videoId: string;
  renditions: string[];
  defaultUrl: string;
}) {
  const [selectedRendition, setSelectedRendition] = useState(renditions?.[0] || "");

  // If a rendition is selected, use its HLS URL; otherwise, use the default
  const hlsUrl = selectedRendition
    ? `/api/hls/${videoId}/${selectedRendition}.m3u8`
    : defaultUrl;

  return (
    <div className="space-y-4">
      <VideoPlayerWrapper src={hlsUrl} />
      <div>
        <label className="mr-2 font-semibold">Choose rendition:</label>
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
    </div>
  );
}