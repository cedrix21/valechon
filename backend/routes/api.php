<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Category;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReportController;
use App\Models\Product;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/menu', function () {
    // Fetch categories with ALL products (including out of stock)
    $categories = Category::with('products')->get();
    
    return response()->json($categories);
});
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/reports/daily', [ReportController::class, 'daily']);
// --- ADMIN ROUTES ---
// Get all products (including out of stock ones)
Route::get('/admin/products', function () {
    return response()->json(Product::with('category')->get());
});

// Toggle a product's availability
Route::patch('/admin/products/{id}/toggle', function ($id) {
    $product = Product::findOrFail($id);
    $product->is_available = !$product->is_available;
    $product->save();
    return response()->json($product);
});

Route::patch('/admin/products/{id}/modifier', function (Request $request, $id) {
    $product = Product::findOrFail($id);
    $product->modifier_stock = $request->input('modifier_stock');
    
    // If the request includes is_available, update it
    if ($request->has('is_available')) {
        $product->is_available = $request->input('is_available');
    }
    
    $product->save();
    return response()->json($product);
});

Route::post('/admin/products', function (Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'category_id' => 'required|exists:categories,id',
        'price' => 'required|numeric|min:0',
        'is_weighted' => 'required|boolean',
        'size' => 'nullable|string',
        'is_free_with_combo' => 'required|boolean',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048' // Max 2MB
    ]);

    $imagePath = null;
    if ($request->hasFile('image')) {
        // Saves the image to storage/app/public/products
        $imagePath = $request->file('image')->store('products', 'public');
    }

    $product = Product::create([
        'name' => $validated['name'],
        'category_id' => $validated['category_id'],
        'price' => $validated['price'],
        'is_weighted' => $validated['is_weighted'],
        'size' => $validated['size'] ?? null,
        'is_free_with_combo' => $validated['is_free_with_combo'],
        'image_path' => $imagePath,
        'is_available' => true,
        'modifier_stock' => ['Spicy' => true, 'Regular' => true]
    ]);

    return response()->json($product, 201);
});

Route::post('/admin/products/{id}/update', function (Request $request, $id) {
    $product = Product::findOrFail($id);

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'category_id' => 'required|exists:categories,id',
        'price' => 'required|numeric|min:0',
        'is_weighted' => 'required|boolean',
        'size' => 'nullable|string',
        'is_free_with_combo' => 'required|boolean',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
    ]);

    // Update image if a new one is uploaded
    if ($request->hasFile('image')) {
        // (Optional) Delete the old image to save space
        if ($product->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($product->image_path);
        }
        $product->image_path = $request->file('image')->store('products', 'public');
    }

    $product->name = $validated['name'];
    $product->category_id = $validated['category_id'];
    $product->price = $validated['price'];
    $product->is_weighted = $validated['is_weighted'];
    $product->size = $validated['size'] ?? null;
    $product->is_free_with_combo = $validated['is_free_with_combo'];
    $product->save();

    return response()->json($product, 200);
});

