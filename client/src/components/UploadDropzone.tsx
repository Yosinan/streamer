"use client";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { uploadVideo } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function UploadDropzone() {
  const router = useRouter();
  const [pct, setPct] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showStartMsg, setShowStartMsg] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    message: string;
    error?: boolean;
  }>({
    open: false,
    message: "",
    error: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (file) setSelectedFile(file);
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setPct(0);
    setUploading(true);
    setShowStartMsg(true);
    try {
      await uploadVideo(selectedFile, { title, description }, setPct);
      setModal({
        open: true,
        message:
          "Upload queued! You can now go to the Videos page to check progress.",
        error: false,
      });
      setSelectedFile(null);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setModal({
        open: true,
        message: "Upload failed. Please try again.",
        error: true,
      });
    } finally {
      setUploading(false);
      setPct(0);
      setShowStartMsg(false);
    }
  }, [selectedFile, title, description]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "video/*": [] },
    maxSize: 2 * 1024 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div>
      <div className="space-y-2 mb-3">
        <input
          className="border p-2 w-full"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={uploading}
        />
        <textarea
          className="border p-2 w-full"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={uploading}
        />
      </div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-10 text-center cursor-pointer transition-opacity flex flex-col items-center justify-center ${
          isDragActive ? "opacity-80" : ""
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        style={{ minHeight: "200px" }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop it like it’s hot 🔥</p>
        ) : uploading ? (
          <p>Uploading...</p>
        ) : previewUrl ? (
          <div className="flex flex-col items-center w-full">
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-48 rounded shadow mb-2"
            />
            <button
              className="text-xs text-red-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Remove video
            </button>
          </div>
        ) : (
          <p>Drag & drop a video here, or click to select</p>
        )}
      </div>
      <button
        className={`mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${
          !selectedFile || uploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {showStartMsg && (
        <div className="mt-4 text-blue-700 font-semibold text-center">
          Upload started! You can go to the Videos page to check progress.
        </div>
      )}
      {uploading && (
        <div className="mt-3">
          <div className="h-2 w-full bg-gray-200 rounded">
            <div
              className="h-2 rounded"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg,#4ade80,#0f172a)",
                transition: "width 0.2s",
              }}
            />
          </div>
          <p className="text-sm mt-1 text-gray-700">{pct}%</p>
        </div>
      )}
      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[300px] text-center">
            <p
              className={`text-lg ${
                modal.error ? "text-red-600" : "text-green-600"
              }`}
            >
              {modal.message}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => router.push("/videos")}
            >
              Go to Videos
            </button>
            <button
              className="mt-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              onClick={() => setModal({ ...modal, open: false })}
            >
              Stay Here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
