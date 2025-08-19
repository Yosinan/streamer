import { getVideo, Video } from "@/lib/api";
import MetadataForm from "@/components/MetadataForm";
import VideoPlayerWrapper from "@/components/VideoPlayerWrapper";
import RenditionSelector from "@/components/RenditionSelector";

export default async function VideoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video: Video = await getVideo(id);
  const playable = video.status === "ready" && !!video.streaming_url;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{video.title || "Untitled video"}</h1>
      <div className="text-sm opacity-70">Status: {video.status}</div>

      {playable ? (
        <VideoPlayerWrapper src={video.streaming_url!} />
      ) : (
        <div className="p-6 border rounded">
          ⏳ Processing… refresh in a bit.
        </div>
      )}

      <RenditionSelector videoId={video.id} renditions={video.renditions} />

      <section>
        <h2 className="text-xl font-semibold mb-2">Edit metadata</h2>
        <MetadataForm video={video} />
      </section>

      <section>
        <h3 className="font-semibold">Renditions</h3>
        <div className="text-sm">{video.renditions?.join(" • ") || "—"}</div>
      </section>
    </main>
  );
}
