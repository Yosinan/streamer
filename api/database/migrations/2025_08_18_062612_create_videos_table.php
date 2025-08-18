<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $t) {
            $t->id();
            $t->uuid('uuid')->unique();
            $t->string('title')->nullable();
            $t->text('description')->nullable();
            $t->string('original_path');      // e.g. originals/{uuid}/source.mp4
            $t->string('hls_path')->nullable(); // e.g. hls/{uuid}/master.m3u8
            $t->json('renditions')->nullable(); // ["1080p","720p","480p"]
            $t->enum('status', ['queued','processing','ready','failed'])->default('queued');
            $t->string('failure_reason')->nullable();
            $t->unsignedBigInteger('size_bytes')->default(0);
            $t->string('content_type')->nullable();
            $t->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
