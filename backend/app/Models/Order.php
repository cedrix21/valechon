<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number', 
        'order_type', 
        'customer_name', 
        'total_amount', 
        'payment_method', 
        'cash_tendered', 
        'change_amount'
    ];

        public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
