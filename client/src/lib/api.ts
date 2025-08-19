import axios, { AxiosInstance } from "axios";

export interface Video {
  id: string; // uuid
  title?: string | null;
  description?: string | null;
  status: "queued" | "processing" | "ready" | "failed";
  renditions: string[];
  streaming_url?: string | null;
  created_at: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const client: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function listVideos(page = 1, perPage = 12) {
  const response = await client.get<Paginated<Video>>("/videos", {
    params: { page, per_page: perPage },
  });
  return response.data;
}

export async function getVideo(id: string) {
  const response = await client.get<Video>(`/videos/${id}`);
  return response.data;
}

export async function updateVideo(id: string, payload: { title?: string; description?: string; file?: File }) {
  if (payload.file) {
    const form = new FormData();
    if (payload.title) form.append("title", payload.title);
    if (payload.description) form.append("description", payload.description);
    form.append("file", payload.file);
    return client
      .post<Video>(`/videos/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  } else {
    return client.post<Video>(`/videos/${id}`, payload).then((r) => r.data);
  }
}

export async function uploadVideo(
  file: File,
  payload?: { title?: string; description?: string },
  onProgress?: (pct: number) => void
) {
  const form = new FormData();
  form.append("file", file);
  if (payload?.title) form.append("title", payload.title);
  if (payload?.description) form.append("description", payload.description);

  return client
    .post<{ id: string; status: string }>("/videos", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
      },
    })
    .then((r) => r.data);
}