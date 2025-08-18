<?php

namespace App\Http\Middleware;
use Closure;

class ApiLogMiddleware
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        logger()->info('api', [
            'path' => $request->path(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'user_id' => optional($request->user())->id,
            'status' => $response->status(),
        ]);

        return $response;
    }
}
