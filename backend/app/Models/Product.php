<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; // <--- Add this

class Product extends Model
{
    use HasFactory, SoftDeletes; // <--- Add SoftDeletes

    protected $fillable = [
        'category_id', 
        'name', 
        'price', 
        'is_weighted', 
        'is_available',
        'modifier_stock',
        'image_path',
        'size', 
        'is_free_with_combo'
    ];
    protected $casts = [
        'modifier_stock' => 'array',
        'is_free_with_combo' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}