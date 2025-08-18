import UploadDropzone from "@/components/UploadDropzone";

export default function UploadPage() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <UploadDropzone />
      <p className="text-sm text-gray-500 mt-4">
        Files up to 2GB. We’ll process 1080/720/480 HLS.
      </p>
    </main>
  );
}
