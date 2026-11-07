import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

export default function Report() {
  const [report, setReport] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Get the accurate local date
  const getLocalDateString = (dateObj) => {
    const offset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - offset).toISOString().split('T')[0];
  };

  const today = getLocalDateString(new Date());
  
  // 2. Initialize both to TODAY
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Fetch data whenever dates change
  useEffect(() => {
    fetch(`http://192.168.0.102:8000/api/reports/daily?start_date=${startDate}&end_date=${endDate}`)
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(data => {
        // Safety check: make sure the data structure is correct
        if (data && data.summary) {
          setReport(data);
        } else {
          console.error("Invalid data format from server:", data);
        }
        setExpandedOrderId(null); 
      })
      .catch(err => {
        console.error(err);
        // If Laravel crashes, we show a blank report instead of a white screen
        setReport({
          date: startDate,
          summary: { total_sales: 0, total_orders: 0 },
          payments: [],
          items: [],
          recent_orders: []
        });
      });
  }, [startDate, endDate]);

  // Handle Date Changes Automatically
    // Handle Start Date Change (The Master Date)
  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    
    // Automatically set the End Date to exactly the next day
    const nextDay = new Date(newStart);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const formattedNextDay = getLocalDateString(nextDay);
    setEndDate(formattedNextDay);
  };

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    // If end date is before start date, automatically pull start date backward
    if (newEnd < startDate) {
      setStartDate(newEnd);
    }
  };

    // Download PDF Function
  const handleDownloadPDF = () => {
    setIsDownloading(true);

    // 1. Build the HTML string
    const htmlString = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #000; background: #fff; width: 1000px;">
        <h1 style="text-align: center; font-size: 28px; margin-bottom: 5px;">VALÉCHON</h1>
        <p style="text-align: center; font-size: 14px; margin-top: 0; margin-bottom: 20px;">Sulit ug Lamian</p>
        <h2 style="text-align: center; font-size: 18px; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          Sales Report: ${startDate} to ${endDate}
        </h2>

        <table style="width: 100%; margin-bottom: 30px; text-align: left; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 33%;">
              <p style="margin: 0; font-size: 12px; color: #666; font-weight: bold;">TOTAL SALES</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">₱${parseFloat(report.summary.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </td>
            <td style="width: 10px;"></td>
            <td style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 33%;">
              <p style="margin: 0; font-size: 12px; color: #666; font-weight: bold;">TOTAL ORDERS</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${report.summary.total_orders || 0}</p>
            </td>
            <td style="width: 10px;"></td>
            <td style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 33%;">
              <p style="margin: 0; font-size: 12px; color: #666; font-weight: bold;">AVG. ORDER VALUE</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">₱${(report.summary.total_orders > 0 ? (report.summary.total_sales / report.summary.total_orders) : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </td>
          </tr>
        </table>

        <table style="width: 100%; margin-bottom: 40px; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 10px;">
              <h3 style="background: #f0f0f0; padding: 10px; margin: 0; border: 1px solid #ccc; font-size: 14px;">Payment Methods</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; font-size: 14px;">
                <tbody>
                  ${report.payments.map(p => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 10px;">${p.payment_method}</td>
                      <td style="padding: 10px; text-align: right; font-weight: bold;">₱${parseFloat(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 10px;">
              <h3 style="background: #f0f0f0; padding: 10px; margin: 0; border: 1px solid #ccc; font-size: 14px;">Items Sold</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; font-size: 14px;">
                <tbody>
                  ${report.items.map(item => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 10px;">
                        ${item.name} 
                        ${item.modifiers 
                          ? `<span style="font-size: 10px; font-weight: bold; color: ${item.modifiers.includes('Spicy') ? 'red' : 'blue'};">[${item.modifiers.toUpperCase()}]</span>` 
                          : ''} 
                        <br/> 
                        <span style="font-size: 11px; color: #666;">
                          ${item.total_kg ? `${parseFloat(item.total_kg).toFixed(2)} kg` : `${item.total_qty} units`}
                        </span>
                      </td>
                      <td style="padding: 10px; text-align: right; font-weight: bold;">₱${parseFloat(item.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
        </table>

        <h3 style="background: #f0f0f0; padding: 10px; margin: 0; border: 1px solid #ccc; font-size: 14px;">Recent Orders</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; font-size: 12px;">
          <thead>
            <tr style="background: #fafafa; border-bottom: 1px solid #ccc; text-align: left;">
              <th style="padding: 10px;">Order #</th>
              <th style="padding: 10px;">Date & Time</th>
              <th style="padding: 10px;">Customer</th>
              <th style="padding: 10px;">Type</th>
              <th style="padding: 10px;">Payment</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${report.recent_orders.map(o => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: bold;">#${o.order_number}</td>
                <td style="padding: 10px;">${new Date(o.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td style="padding: 10px;">${o.customer_name}</td>
                <td style="padding: 10px; text-transform: uppercase;">${o.order_type}</td>
                <td style="padding: 10px;">${o.payment_method}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">₱${parseFloat(o.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // 2. Set the PDF options
    const opt = {
      margin:       0.5,
      filename:     `Valechon_Report_${startDate}_to_${endDate}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1200 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css'] } // Prevents tables from breaking mid-row
    };

    // 3. Create the temporary element so html2pdf can render it properly
    const element = document.createElement('div');
    element.innerHTML = htmlString;
    element.style.width = '1200px'; // Force the width so the PDF doesn't wrap awkwardly
    document.body.appendChild(element);

    // 4. Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
      setIsDownloading(false);
      document.body.removeChild(element); // Clean up
    }).catch(err => {
      console.error("PDF Error:", err);
      setIsDownloading(false);
      document.body.removeChild(element);
    });
  };

  if (!report) return <div className="h-screen bg-[#1e1e24] text-white flex justify-center items-center text-xl font-bold">Loading Report...</div>;

  const items = report.items || [];
  const displayedItems = showAllItems ? items : items.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#1e1e24] text-gray-200 p-4 md:p-8 font-sans pb-20">
      
      


      {/* MAIN UI (DARK MODE) */}
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Date Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 border-b border-[#353540] pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#7b1e23] italic tracking-wider">Valéchon</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest mt-1 text-sm">Sales Report</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-[#2a2a32] p-2 rounded-xl border border-[#353540]">
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">From</span>
              <input 
                type="date" 
                value={startDate}
                onChange={handleStartDateChange}
                className="bg-[#1e1e24] text-white font-semibold px-3 py-2 rounded-lg border border-[#353540] focus:outline-none focus:border-yellow-500 cursor-pointer text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">To</span>
              <input 
                type="date" 
                value={endDate}
                onChange={handleEndDateChange}
                className="bg-[#1e1e24] text-white font-semibold px-3 py-2 rounded-lg border border-[#353540] focus:outline-none focus:border-yellow-500 cursor-pointer text-sm"
              />
            </div>

            <div className="h-8 w-px bg-[#353540] mx-1"></div>

            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:bg-gray-600 text-sm"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>

          <Link to="/" className="text-yellow-500 text-sm hover:underline font-bold hidden lg:block">&larr; Back to POS</Link>
        </div>

        {/* UI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#2a2a32] p-6 rounded-2xl border border-[#353540] shadow-lg border-l-4 border-l-green-500">
            <p className="text-gray-400 font-bold text-sm mb-2 uppercase tracking-wider">Total Sales</p>
            <p className="text-4xl font-extrabold text-green-400">
              ₱{parseFloat(report.summary.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#2a2a32] p-6 rounded-2xl border border-[#353540] shadow-lg border-l-4 border-l-yellow-500">
            <p className="text-gray-400 font-bold text-sm mb-2 uppercase tracking-wider">Total Orders</p>
            <p className="text-4xl font-extrabold text-yellow-500">{report.summary.total_orders || 0}</p>
          </div>
          <div className="bg-[#2a2a32] p-6 rounded-2xl border border-[#353540] shadow-lg border-l-4 border-l-blue-500">
            <p className="text-gray-400 font-bold text-sm mb-2 uppercase tracking-wider">Avg. Order Value</p>
            <p className="text-4xl font-extrabold text-blue-400">
              ₱{(report.summary.total_orders > 0 ? (report.summary.total_sales / report.summary.total_orders) : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#2a2a32] p-6 rounded-2xl border border-[#353540] shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-6 border-b border-[#353540] pb-3 text-gray-200">Payment Methods</h2>
            <ul className="space-y-4">
              {report.payments.map((pay, index) => (
                <li key={index} className="flex justify-between items-center bg-[#1e1e24] p-4 rounded-xl border border-[#353540]">
                  <span className="font-bold text-gray-300">{pay.payment_method}</span>
                  <span className="font-extrabold text-lg">
                    ₱{parseFloat(pay.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
              {report.payments.length === 0 && <p className="text-gray-500 text-center py-4">No payments recorded.</p>}
            </ul>
          </div>

          <div className="bg-[#2a2a32] p-6 rounded-2xl border border-[#353540] shadow-lg">
            <h2 className="text-xl font-bold mb-6 border-b border-[#353540] pb-3 text-gray-200">Items Sold</h2>
            <ul className="space-y-3">
              {displayedItems.map((item, index) => (
                <li key={index} className="flex justify-between items-center bg-[#1e1e24] p-4 rounded-xl border border-[#353540]">
                  <div>
                    <p className="font-bold text-white text-base flex items-center gap-2">
                      {item.name}
                      {/* Changed: Removed the "!== Regular" check */}
                      {item.modifiers && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          item.modifiers.includes('Spicy') 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {item.modifiers.includes('Spicy') ? 'Spicy' : 'Regular'}
                        </span>
                      )}
                    </p>
                    {item.total_kg ? (
                      <p className="text-xs text-gray-400 font-semibold mt-1">{parseFloat(item.total_kg).toFixed(2)} kg</p>
                    ) : (
                      <p className="text-xs text-gray-400 font-semibold mt-1">{item.total_qty} units</p>
                    )}
                  </div>
                  <span className="font-extrabold text-green-400">
                    ₱{parseFloat(item.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
              {items.length === 0 && <p className="text-gray-500 text-center py-4">No items recorded.</p>}
            </ul>

            {items.length > 5 && (
              <button 
                onClick={() => setShowAllItems(!showAllItems)}
                className="w-full mt-4 bg-[#353540] text-gray-300 font-bold py-3 rounded-xl hover:bg-[#404050] transition-colors border border-[#404050]"
              >
                {showAllItems ? 'Show Less' : `Show ${items.length - 5} More Items`}
              </button>
            )}
          </div>
        </div>

        {/* UI Recent Orders */}
        <div className="mt-8 bg-[#2a2a32] p-4 md:p-6 rounded-2xl border border-[#353540] shadow-lg">
          <h2 className="text-xl font-bold mb-4 md:mb-6 border-b border-[#353540] pb-3 text-gray-200">Recent Orders</h2>
          
          {/* DESKTOP TABLE (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-[#353540]">
                  <th className="pb-3 px-2 font-bold uppercase tracking-wider">Order #</th>
                  <th className="pb-3 px-2 font-bold uppercase tracking-wider">Date & Time</th>
                  <th className="pb-3 px-2 font-bold uppercase tracking-wider">Customer</th>
                  <th className="pb-3 px-2 font-bold uppercase tracking-wider">Type</th>
                  <th className="pb-3 px-2 font-bold uppercase tracking-wider">Payment</th>
                  <th className="pb-3 px-2 font-bold uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353540]">
                {report.recent_orders && report.recent_orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className="hover:bg-[#353540]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-2 font-mono text-yellow-500 font-bold flex items-center gap-2">
                        <span className="text-gray-500 group-hover:text-white transition-colors">
                          {expandedOrderId === order.id ? '▼' : '▶'}
                        </span>
                        #{order.order_number}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-300">
                        {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-2 font-semibold text-white">{order.customer_name}</td>
                      <td className="py-3 px-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          order.order_type === 'dine-in' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {order.order_type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-300 font-semibold">{order.payment_method}</td>
                      <td className="py-3 px-2 text-right font-bold text-green-400">
                        ₱{parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {expandedOrderId === order.id && (
                      <tr>
                        <td colSpan="6" className="bg-[#1e1e24] p-4 border-b border-[#353540]">
                          <div className="bg-[#2a2a32] rounded-lg border border-[#404050] overflow-hidden">
                            <div className="px-4 py-2 bg-[#353540] border-b border-[#404050] text-xs font-bold text-gray-400 uppercase tracking-wider">
                              Order Items
                            </div>
                            <ul className="divide-y divide-[#353540]">
                              {order.items.map((item) => (
                                <li key={item.id} className="px-4 py-3 flex justify-between items-center text-sm">
                                  <div>
                                    <span className="font-bold text-white">{item.product_name}</span>
                                    {item.weight_in_kg ? (
                                      <span className="text-gray-400 text-xs ml-2">({item.weight_in_kg} kg)</span>
                                    ) : (
                                      <span className="text-gray-400 text-xs ml-2">(Qty: {item.quantity})</span>
                                    )}
                                    {/* Changed: Removed the "!== Regular" check */}
                                    {item.modifiers && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider ml-2 ${
                                        item.modifiers.includes('Spicy') 
                                          ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                      }`}>{item.modifiers}</span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-gray-300">
                                    ₱{parseFloat(item.price_at_time_of_sale).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="px-4 py-3 bg-[#2a2a32] border-t border-[#353540] flex flex-col gap-1 text-sm">
                              <div className="flex justify-between items-center font-bold text-white">
                                <span>TOTAL AMOUNT:</span>
                                <span className="text-green-400">₱{parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {order.payment_method === 'Cash' && (
                                <>
                                  <div className="flex justify-between items-center text-gray-400 text-xs mt-1">
                                    <span>Cash Tendered:</span>
                                    <span>₱{parseFloat(order.cash_tendered).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-gray-400 text-xs">
                                    <span>Change:</span>
                                    <span>₱{parseFloat(order.change_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {(!report.recent_orders || report.recent_orders.length === 0) && (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-500">No orders found for this date range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS (Hidden on Desktop) */}
          <div className="md:hidden flex flex-col gap-3">
            {report.recent_orders && report.recent_orders.map((order) => (
              <div key={order.id} className="bg-[#1e1e24] rounded-xl border border-[#353540] overflow-hidden">
                
                {/* Card Header */}
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#353540]/50"
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-500 font-bold font-mono">#{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        order.order_type === 'dine-in' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {order.order_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 font-semibold">{order.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400 text-lg">₱{parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-400 mt-1">{order.payment_method}</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrderId === order.id && (
                  <div className="p-4 border-t border-[#353540] bg-[#2a2a32]">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Items</h4>
                    <ul className="space-y-2 mb-3">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between items-start text-sm">
                          <div>
                            <span className="font-bold text-white">{item.product_name}</span>
                            {item.weight_in_kg ? (
                              <span className="text-gray-400 text-xs ml-1">({item.weight_in_kg} kg)</span>
                            ) : (
                              <span className="text-gray-400 text-xs ml-1">x{item.quantity}</span>
                            )}
                            {item.modifiers && item.modifiers !== 'Regular' && (
                              <span className={`block mt-1 text-[10px] px-1.5 py-0.5 rounded border uppercase w-max ${
                                item.modifiers.includes('Spicy') ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>{item.modifiers}</span>
                            )}
                          </div>
                          <span className="font-semibold text-gray-300">₱{parseFloat(item.price_at_time_of_sale).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </li>
                      ))}
                    </ul>
                    {order.payment_method === 'Cash' && (
                      <div className="text-xs text-gray-400 bg-[#1e1e24] p-2 rounded border border-[#353540] flex justify-between">
                        <span>Tendered: ₱{parseFloat(order.cash_tendered).toFixed(2)}</span>
                        <span>Change: ₱{parseFloat(order.change_amount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}