<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;


class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid','title','description','original_path','hls_path',
        'renditions','status','failure_reason','size_bytes','content_type'
    ];

    protected $casts = [
        'renditions' => 'array',
    ];

    public function getStreamingUrlAttribute(): ?string
    {
        if (!$this->hls_path) return null;

        // if bucket is public via CDN:
        if (!filter_var(env('R2_PRIVATE_BUCKET', false), FILTER_VALIDATE_BOOL)) {
            return rtrim(Storage::disk('r2')->url($this->hls_path), '/');
        }

        // private bucket => temporary signed URL
        return Storage::disk('r2')->temporaryUrl($this->hls_path, now()->addMinutes(15));
    }
}

