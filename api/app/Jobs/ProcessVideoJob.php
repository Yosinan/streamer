<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Video;
use \Throwable;
use Symfony\Component\Process\Process;

class ProcessVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Video $video) {}

    public function handle(): void
    {
        Log::info("ProcessVideoJob: Started for video {$this->video->uuid}");

        $this->video->update(['status' => 'processing']);

        $uuid = $this->video->uuid;
        $workDir = storage_path("app/tmp/{$uuid}");

        Log::info("ProcessVideoJob: Creating work directory at {$workDir}");

        File::ensureDirectoryExists($workDir);

        // 1) download original locally
        $tmpInput = "{$workDir}/input";

        Log::info("ProcessVideoJob: Downloading original from R2 ({$this->video->original_path}) to {$tmpInput}");

        $stream = Storage::disk('r2')->readStream($this->video->original_path);
        file_put_contents($tmpInput, stream_get_contents($stream));
        fclose($stream);

        // 2) transcode to HLS (1080/720/480)
        $variants = [
            ['name'=>'1080p', 'w'=>1920, 'h'=>1080, 'vb'=>'5000k', 'ab'=>'192k'],
            ['name'=>'720p',  'w'=>1280, 'h'=>720,  'vb'=>'3000k', 'ab'=>'160k'],
            ['name'=>'480p',  'w'=>854,  'h'=>480,  'vb'=>'1200k', 'ab'=>'128k'],
        ];

        $hlsLocal = "{$workDir}/hls";

        Log::info("ProcessVideoJob: Creating HLS output directory at {$hlsLocal}");

        File::ensureDirectoryExists($hlsLocal);

        // create per-variant playlists
        // foreach ($variants as $v) {
        //     $cmd = [
        //         'ffmpeg', '-y', '-i', $tmpInput,
        //         '-vf', "scale=w={$v['w']}:h={$v['h']}:force_original_aspect_ratio=decrease",
        //         '-c:a', 'aac', '-b:a', $v['ab'],
        //         '-c:v', 'h264', '-preset', 'veryfast', '-profile:v', 'main', '-b:v', $v['vb'],
        //         '-sc_threshold', '0',
        //         '-hls_time', '6',
        //         '-hls_playlist_type', 'vod',
        //         '-hls_segment_filename', "{$hlsLocal}/{$v['name']}_%03d.ts",
        //         "{$hlsLocal}/{$v['name']}.m3u8",
        //     ];
        //     $this->run($cmd);
        // }
            foreach ($variants as $v) {

                Log::info("ProcessVideoJob: Transcoding to {$v['name']} ({$v['w']}x{$v['h']})");

                $cmd = [
                    'ffmpeg', '-y', '-i', $tmpInput,
                    '-vf', "scale=w={$v['w']}:h={$v['h']}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
                    '-c:a', 'aac', '-b:a', $v['ab'],
                    '-c:v', 'h264', '-preset', 'veryfast', '-profile:v', 'main', '-b:v', $v['vb'],
                    '-sc_threshold', '0',
                    '-hls_time', '6',
                    '-hls_playlist_type', 'vod',
                    '-hls_segment_filename', "{$hlsLocal}/{$v['name']}_%03d.ts",
                    "{$hlsLocal}/{$v['name']}.m3u8",
                ];

                Log::info("ProcessVideoJob: Running ffmpeg command for {$v['name']}", ['cmd' => implode(' ', $cmd)]);
                
                $this->run($cmd);

                Log::info("ProcessVideoJob: Finished transcoding {$v['name']}");
            }

        // 3) master playlist

        Log::info("ProcessVideoJob: Generating master playlist");

        $master = "#EXTM3U\n";
        $master .= "#EXT-X-VERSION:3\n";
        $master .= "#EXT-X-INDEPENDENT-SEGMENTS\n";
        $bw = ['1080p'=>6000000,'720p'=>3500000,'480p'=>1500000];
        $res = ['1080p'=>'1920x1080','720p'=>'1280x720','480p'=>'854x480'];
        foreach ($variants as $v) {
            $n = $v['name'];
            $master .= "#EXT-X-STREAM-INF:BANDWIDTH={$bw[$n]},RESOLUTION={$res[$n]}\n{$n}.m3u8\n";
        }
        file_put_contents("{$hlsLocal}/master.m3u8", $master);

        // 4) upload HLS to R2
        $remotePrefix = "hls/{$uuid}";
        $files = collect(File::files($hlsLocal))->map->getPathname();
        foreach ($files as $path) {
            $key = "{$remotePrefix}/".basename($path);
            $contentType = str_ends_with($key, '.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T';
            
            Log::info("ProcessVideoJob: Uploading {$key} to R2 (type: {$contentType})");

            Storage::disk('r2')->put($key, file_get_contents($path), [
                'visibility' => env('R2_PRIVATE_BUCKET', false) ? 'private' : 'public',
                'ContentType' => $contentType,
            ]);
        }

        // 5) update db

        Log::info("ProcessVideoJob: Updating video record in DB");

        $this->video->update([
            'hls_path' => "{$remotePrefix}/master.m3u8",
            'renditions' => array_column($variants, 'name'),
            'status' => 'ready',
        ]);

        // cleanup

        Log::info("ProcessVideoJob: Cleaning up work directory {$workDir}");

        File::deleteDirectory($workDir);

        Log::info("ProcessVideoJob: ✅ Completed for video {$this->video->uuid}");
    }

    public function failed(Throwable $e): void
    {
        $this->video->update(['status' => 'failed', 'failure_reason' => $e->getMessage()]);
    }

    private function run(array $cmd): void
    {
        $p = new Process($cmd, timeout: 3600);
        $p->mustRun();
    }
}

