<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VideoController;

Route::group([],function () {
    Route::post('/videos', [VideoController::class, 'store']);
    Route::get('/videos', [VideoController::class, 'index']);
    Route::get('/videos/{id}', [VideoController::class, 'show']);
    Route::post('/videos/{id}', [VideoController::class, 'update']);
    Route::get('/hls/{uuid}/{filename}', [VideoController::class, 'streamHLS']);
    Route::delete('/videos/{id}', [VideoController::class, 'destroy']);
});
