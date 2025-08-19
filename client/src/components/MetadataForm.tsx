// "use client";
// import { useState } from "react";
// import { updateVideo, Video } from "@/lib/api";

// export default function MetadataForm({
//   video,
//   onSaved,
// }: {
//   video: Video;
//   onSaved?: (v: Video) => void;
// }) {
//   const [title, setTitle] = useState(video.title ?? "");
//   const [description, setDescription] = useState(video.description ?? "");
//   const [saving, setSaving] = useState(false);
//   const [replace, setReplace] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [showToast, setShowToast] = useState(false);

//   async function save() {
//     setSaving(true);
//     const updated = await updateVideo(video.id, { title, description });
//     setSaving(false);
//     setShowToast(true);
//     setTimeout(() => setShowToast(false), 2000); // Show toast for 2 seconds
//     onSaved?.(updated);
//   }

//   return (
//     <div className="space-y-2">
//       <input
//         className="border p-2 w-full"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="Title"
//       />
//       <textarea
//         className="border p-2 w-full"
//         value={description}
//         onChange={(e) => setDescription(e.target.value)}
//         placeholder="Description"
//       />
//       <button onClick={save} disabled={saving} className="border px-4 py-2">
//         {saving ? "Updating" : "Update"}
//       </button>
//       {showToast && (
//         <div
//           className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-100"
//           style={{ minWidth: 120, textAlign: "center" }}
//         >
//           <span className="font-semibold">Updated!</span>
//         </div>
//       )}
//     </div>
//   );
// }
'use client'
import { useState, useCallback } from "react";
import { updateVideo, Video } from "@/lib/api";
import { useDropzone } from "react-dropzone";
import UploadDropzone from "@/components/UploadDropzone";

export default function MetadataForm({ video }: { video: Video }) {
  const [title, setTitle] = useState(video.title ?? "");
  const [description, setDescription] = useState(video.description ?? "");
  const [replace, setReplace] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropzone setup
  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    setFile(f ?? null);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "video/*": [] },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateVideo(video.id, {
        title,
        description,
        ...(replace && file ? { file } : {}),
      });
      // window.location.reload(); // reload to reflect changes
    } catch (err: any) {
      setError("Failed to update video.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block font-medium">Title</label>
        <input
          className="border p-2 w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
        />
      </div>
      <div>
        <label className="block font-medium">Description</label>
        <textarea
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => setReplace(e.target.checked)}
          id="replace"
        />
        <label htmlFor="replace">Replace video file</label>
      </div>
      {replace && (
        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the video here…</p>
          ) : file ? (
            <div className="flex flex-col items-center">
              <video
                src={previewUrl ?? ""}
                controls
                className="max-w-full max-h-48 rounded shadow mb-2"
              />
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreviewUrl(null);
                }}
              >
                Remove video
              </button>
            </div>
          ) : (
            <p>Drag & drop a video here, or click to select</p>
          )}
        </div>
      )}
      {error && <div className="text-red-500">{error}</div>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}