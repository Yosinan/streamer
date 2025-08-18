<?php

namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class VideoStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title' => ['nullable','string','max:150'],
            'description' => ['nullable','string','max:1000'],
            'file' => ['required','file','mimetypes:video/mp4,video/quicktime,video/x-matroska','max:2048000'], // ~2GB
        ];
    }
}
