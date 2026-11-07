<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function daily(Request $request)
    {
        // Default to today if no dates are provided
        $startDate = $request->query('start_date', Carbon::today()->format('Y-m-d'));
        $endDate = $request->query('end_date', Carbon::today()->format('Y-m-d'));

        // Ensure time covers the whole end day (23:59:59)
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // 1. Get overall sales totals
        $salesSummary = Order::whereBetween('created_at', [$start, $end])
            ->selectRaw('count(*) as total_orders, sum(total_amount) as total_sales')
            ->first();

        // 2. Get payment method breakdown
        $payments = Order::whereBetween('created_at', [$start, $end])
            ->selectRaw('payment_method, sum(total_amount) as amount')
            ->groupBy('payment_method')
            ->get();

        // 3. Get item breakdown
        $itemBreakdown = OrderItem::whereBetween('order_items.created_at', [$start, $end])
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->selectRaw("
                products.name, 
                SUBSTRING_INDEX(order_items.modifiers, ' | ', 1) as modifiers,
                sum(order_items.quantity) as total_qty, 
                sum(order_items.weight_in_kg) as total_kg, 
                sum(
                    CASE 
                        WHEN order_items.weight_in_kg IS NOT NULL THEN (order_items.price_at_time_of_sale * order_items.weight_in_kg)
                        ELSE (order_items.price_at_time_of_sale * order_items.quantity)
                    END
                ) as total_revenue
            ")
            ->groupBy('products.id', 'products.name', DB::raw("SUBSTRING_INDEX(order_items.modifiers, ' | ', 1)"))
            ->get();

        // 4. Get recent orders
        $recentOrders = Order::whereBetween('created_at', [$start, $end])
            ->with(['items' => function($query) {
                $query->join('products', 'order_items.product_id', '=', 'products.id')
                      ->select('order_items.*', 'products.name as product_name');
            }])
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'summary' => $salesSummary,
            'payments' => $payments,
            'items' => $itemBreakdown,
            'recent_orders' => $recentOrders
        ]);
    }
}