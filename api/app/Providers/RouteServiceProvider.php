<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;

class RouteServiceProvider extends ServiceProvider
{
    public function boot()
    {
        RateLimiter::for('video-uploads', function (Request $request) {
            return Limit::perMinute((int)env('UPLOADS_PER_MINUTE', 6))->by(
                $request->user()?->id ?: $request->ip()
            );
        });

        // ...other boot logic...
    }
}