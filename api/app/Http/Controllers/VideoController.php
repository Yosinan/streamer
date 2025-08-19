<?php

/**
 * @OA\Info(
 *     title="GDT Tasks API",
 *     version="1.0.0",
 *     description="API documentation for GDT Tasks"
 * )
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Video;
use App\Http\Requests\VideoStoreRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Jobs\ProcessVideoJob;
use Illuminate\Support\Facades\Log;

class VideoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/videos",
     *     summary="List all videos",
     *     tags={"Videos"},
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=12)),
     *     @OA\Response(
     *         response=200,
     *         description="List of videos",
     *         @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/Video"))
     *     )
     * )
     */
    public function index(Request $req)
    {
        $videos = Video::query()->latest()->paginate(
            perPage: (int)$req->integer('per_page', 12)
        );

        return response()->json($videos);
    }

    /**
     * @OA\Get(
     *     path="/api/videos/{id}",
     *     summary="Get video details",
     *     tags={"Videos"},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(
     *         response=200,
     *         description="Video details",
     *         @OA\JsonContent(ref="#/components/schemas/Video")
     *     )
     * )
     */
    public function show($id)
    {
        $video = Video::where('uuid', $id)->orWhere('id', $id)->firstOrFail();

        // Generate the proxy HLS URL if the video is ready
        $streaming_url = null;
        if ($video->status === 'ready') {
            $streaming_url = url("/api/hls/{$video->uuid}/master.m3u8");
        }

        return response()->json([
            'id' => $video->uuid,
            'title' => $video->title,
            'description' => $video->description,
            'status' => $video->status,
            'renditions' => $video->renditions ?? [],
            'streaming_url' => $streaming_url,
            'created_at' => $video->created_at,
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/videos/{id}",
     *     summary="Update video metadata",
     *     tags={"Videos"},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"title", "description"},
     *             @OA\Property(property="title", type="string", maxLength=150),
     *             @OA\Property(property="description", type="string", maxLength=1000)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Video metadata updated",
     *         @OA\JsonContent(ref="#/components/schemas/Video")
     *     )
     * )
     */
    public function update(Request $req, $id)
    {
        Log::info('File info', [
            'has_file' => $req->hasFile('file'),
            'file_name' => $req->hasFile('file') ? $req->file('file')->getClientOriginalName() : null,
        ]);
        $data = $req->validate([
            'title' => ['nullable','string','max:150'],
            'description' => ['nullable','string','max:1000'],
            'file' => ['nullable', 'file', 'mimetypes:video/mp4,video/quicktime,video/x-matroska']
        ]);

        $video = Video::where('uuid', $id)->orWhere('id', $id)->firstOrFail();

        // If a new file is uploaded, replace the video
        if ($req->hasFile('file')) {
            Log::info('Replacing video file', [
                'video_id' => $video->id,
                'uuid' => $video->uuid,
            ]);
            // Delete old video from R2
            Storage::disk('r2')->delete($video->original_path);

            $file = $req->file('file');
            $uuid = $video->uuid;
            $originalPath = "originals/{$uuid}/source.".$file->getClientOriginalExtension();

            // Upload new video to R2
            Storage::disk('r2')->put($originalPath, file_get_contents($file->getRealPath()), [
                'visibility' => 'private',
                'ContentType' => $file->getMimeType(),
            ]);

            // Update video fields
            $video->original_path = $originalPath;
            $video->size_bytes = $file->getSize();
            $video->content_type = $file->getMimeType();
            $video->status = 'queued';
            $video->renditions = null; // Clear previous renditions

            // Dispatch HLS conversion
            ProcessVideoJob::dispatch($video->id);
        }

        $video->fill($data)->save();

        return response()->json($video);
    }


    /**
     * @OA\Post(
     *     path="/api/videos",
     *     summary="Upload a new video",
     *     tags={"Videos"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"file"},
     *             @OA\Property(property="title", type="string", maxLength=150),
     *             @OA\Property(property="description", type="string", maxLength=1000),
     *             @OA\Property(property="file", type="string", format="binary")
     *         )
     *     ),
     *     @OA\Response(
     *         response=202,
     *         description="Video queued for processing",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="string"),
     *             @OA\Property(property="status", type="string")
     *         )
     *     )
     * )
     */
    public function store(VideoStoreRequest $req)
    {
        Log::info('Video upload initiated', $req->all());
        $uuid = (string) Str::uuid();
        $file = $req->file('file');

        $originalPath = "originals/{$uuid}/source.".$file->getClientOriginalExtension();

        // push original to R2
        Storage::disk('r2')->put($originalPath, file_get_contents($file->getRealPath()), [
            'visibility' => 'private',
            'ContentType' => $file->getMimeType(),
        ]);

        $video = Video::create([
            'uuid' => $uuid,
            'title' => $req->input('title'),
            'description' => $req->input('description'),
            'original_path' => $originalPath,
            'status' => 'queued',
            'size_bytes' => $file->getSize(),
            'content_type' => $file->getMimeType(),
        ]);

        // queue processing
        ProcessVideoJob::dispatch($video);

        return response()->json([
            'id' => $video->uuid,
            'status' => $video->status,
        ], 202);
    }

    /** @OA\Get(
     *     path="/api/videos/{id}/hls/{filename}",
     *     summary="Stream HLS video segments",
     *     tags={"Videos"},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Parameter(name="filename", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(
     *         response=200,
     *         description="HLS video segment",
     *         @OA\MediaType(mediaType="application/vnd.apple.mpegurl"),
     *         @OA\MediaType(mediaType="video/mp2t")
     *     )
     * )
     */
    public function streamHLS($uuid, $filename)
    {
        $path = "hls/{$uuid}/{$filename}";
        if (!Storage::disk('r2')->exists($path)) {
            abort(404);
        }

        // Set correct MIME type for HLS playlists and segments
        $mime = 'application/vnd.apple.mpegurl';
        if (str_ends_with($filename, '.ts')) {
            $mime = 'video/mp2t';
        }

        $content = Storage::disk('r2')->get($path);

        return response($content, 200)
            ->header('Content-Type', $mime);
    }
    /** 
     * @OA\Delete(
     *     path="/api/videos/{id}",
     *     summary="Delete a video",
     *     tags={"Videos"},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(
     *         response=204,
     *         description="Video deleted"
     *     )
     * )
     */
    public function destroy($id)
    {
        // delete from R2
        $video = Video::where('uuid', $id)->orWhere('id', $id)->firstOrFail();
        Storage::disk('r2')->delete($video->original_path);
        $video->delete();

        return response()->json(null, 204);
    }

}

