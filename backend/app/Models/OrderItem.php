<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id', 
        'quantity', 
        'price_at_time_of_sale', 
        'weight_in_kg', 
        'modifiers'
    ];

    
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
