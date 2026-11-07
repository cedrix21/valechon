<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Categories
        $combosId = DB::table('categories')->insertGetId(['name' => 'Combos', 'created_at' => now()]);
        $lechonId = DB::table('categories')->insertGetId(['name' => 'Lechon Belly', 'created_at' => now()]);
        $rollId = DB::table('categories')->insertGetId(['name' => 'Lechon Roll', 'created_at' => now()]);
        $drinksId = DB::table('categories')->insertGetId(['name' => 'Drinks', 'created_at' => now()]);

        // 2. Create Products
        DB::table('products')->insert([
            // Combos
            ['category_id' => $combosId, 'name' => 'Combo Meal', 'price' => 115.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
            ['category_id' => $combosId, 'name' => 'Unli-Combo Meal', 'price' => 125.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
            
            // Lechon Belly
            ['category_id' => $lechonId, 'name' => '1/4 kg Lechon Belly', 'price' => 215.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
            ['category_id' => $lechonId, 'name' => '1/2 kg Lechon Belly', 'price' => 430.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
            ['category_id' => $lechonId, 'name' => '1 kg Lechon Belly', 'price' => 860.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
            
            // Lechon Roll
            ['category_id' => $rollId, 'name' => 'Lechon Belly Roll', 'price' => 860.00, 'is_weighted' => true, 'is_available' => true, 'created_at' => now()],
            
            // Drinks (Placeholders for the free drink/upgrades)
            ['category_id' => $drinksId, 'name' => 'Coke 8oz', 'price' => 0.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
            ['category_id' => $drinksId, 'name' => 'Royal 8oz', 'price' => 0.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
            ['category_id' => $drinksId, 'name' => 'Drink Upgrade (12oz)', 'price' => 5.00, 'is_weighted' => false, 'is_available' => true, 'created_at' => now()],
        ]);
    }
}