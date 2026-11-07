<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validate the incoming data
        $validated = $request->validate([
            'order_type' => 'required|string',
            'customer_name' => 'nullable|string',
            'total_amount' => 'required|numeric',
            'payment_method' => 'required|string',
            'cash_tendered' => 'nullable|numeric',
            'change_amount' => 'nullable|numeric',
            'items' => 'required|array',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer',
            'items.*.price' => 'required|numeric',
            'items.*.weight' => 'nullable|numeric',
            'items.*.modifiers' => 'nullable|string',
        ]);
        
        // FIX: Clean up the items before saving to prevent type errors
        $itemsData = array_map(function($item) {
            return [
                'product_id' => $item['id'],
                'quantity' => (int) $item['quantity'],
                'price_at_time_of_sale' => (float) $item['price'],
                'weight_in_kg' => (isset($item['weight']) && $item['weight'] !== null) ? (float) $item['weight'] : null,
                'modifiers' => $item['modifiers'] ?? null,
            ];
        }, $validated['items']);

        try {
            DB::beginTransaction();

            // 2. Generate Order Number (e.g., 0001, 0002)
            $latestOrder = Order::latest('id')->first();
            $nextOrderNumber = $latestOrder ? str_pad($latestOrder->id + 1, 4, '0', STR_PAD_LEFT) : '0001';

            // 3. Create the Order
            $order = Order::create([
                'order_number' => $nextOrderNumber,
                'order_type' => $validated['order_type'],
                'customer_name' => $validated['customer_name'],
                'total_amount' => $validated['total_amount'],
                'payment_method' => $validated['payment_method'],
                'cash_tendered' => $validated['cash_tendered'] ?? $validated['total_amount'],
                'change_amount' => $validated['change_amount'] ?? 0,
            ]);

            // 4. Create the Order Items (using our cleaned $itemsData array)
            foreach ($itemsData as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price_at_time_of_sale' => $item['price_at_time_of_sale'],
                    'weight_in_kg' => $item['weight_in_kg'],
                    'modifiers' => $item['modifiers'],
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Order saved successfully',
                'order_number' => $nextOrderNumber,
                'order' => $order
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to save order', 'details' => $e->getMessage()], 500);
        }
    }
}