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
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->string('order_number')->unique(); // e.g., 0001
        $table->string('order_type'); // dine-in or takeout
        $table->string('customer_name')->nullable(); // e.g., John
        $table->decimal('total_amount', 10, 2);
        $table->string('payment_method'); // Cash, GCash, Maya
        $table->decimal('cash_tendered', 10, 2)->nullable();
        $table->decimal('change_amount', 10, 2)->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
