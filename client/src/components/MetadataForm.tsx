"use client";
import { useState } from "react";
import { updateVideo, Video } from "@/lib/api";

export default function MetadataForm({
  video,
  onSaved,
}: {
  video: Video;
  onSaved?: (v: Video) => void;
}) {
  const [title, setTitle] = useState(video.title ?? "");
  const [description, setDescription] = useState(video.description ?? "");
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  async function save() {
    setSaving(true);
    const updated = await updateVideo(video.id, { title, description });
    setSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000); // Show toast for 2 seconds
    onSaved?.(updated);
  }

  return (
    <div className="space-y-2">
      <input
        className="border p-2 w-full"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <textarea
        className="border p-2 w-full"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button onClick={save} disabled={saving} className="border px-4 py-2">
        {saving ? "Updating" : "Update"}
      </button>
      {showToast && (
        <div
          className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-100"
          style={{ minWidth: 120, textAlign: "center" }}
        >
          <span className="font-semibold">Updated!</span>
        </div>
      )}
    </div>
  );
}
