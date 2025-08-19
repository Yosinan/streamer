import { listVideos, Paginated, Video } from "@/lib/api";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const data: Paginated<Video> = await listVideos(page).catch(() => ({
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  }));

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Videos</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {data.data.map((v) => (
          <a key={v.id} href={`/videos/${v.id}`} className="border p-3 block">
            <div className="font-semibold">{v.title || "Untitled"}</div>
            <div className="text-sm opacity-70">{v.status}</div>
            <div className="text-xs opacity-60">
              {new Date(v.created_at).toLocaleString()}
            </div>
          </a>
        ))}
      </div>
      {/* super basic pager */}
      <div className="flex gap-2 mt-6">
        {Array.from({ length: data.last_page }).map((_, i) => (
          <a
            key={i}
            className={`px-3 py-1 border ${
              i + 1 === data.current_page ? "font-bold" : ""
            }`}
            href={`?page=${i + 1}`}
          >
            {i + 1}
          </a>
        ))}
      </div>
    </main>
  );
}
