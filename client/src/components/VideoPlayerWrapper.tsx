"use client";

import dynamic from "next/dynamic";

const VideoPlayer = dynamic(() => import("./VideoPlayer"), {
  ssr: false,
});

export default function VideoPlayerWrapper({ src }: { src: string }) {
  return <VideoPlayer src={src} />;
}