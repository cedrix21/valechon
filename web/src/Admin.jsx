import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
    const [categories, setCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null); // Tracks if we are editing
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    price: '',
    is_weighted: false,
    size: '', 
    is_free_with_combo: false 
  });

  // Simple Auth Check
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      fetchProducts();
      // Fetch categories for the dropdown
      fetch('http://192.168.0.102:8000/api/menu')
        .then(res => res.json())
        .then(data => setCategories(data));
    } else {
      alert("Incorrect password");
    }
  };

  const fetchProducts = () => {
    fetch('http://192.168.0.102:8000/api/admin/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  const toggleProduct = async (id) => {
    try {
      const response = await fetch(`http://192.168.0.102:8000/api/admin/products/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        // Update the local state without reloading the page
        setProducts(products.map(p => 
          p.id === id ? { ...p, is_available: !p.is_available } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling product:", error);
    }
  };

  // NEW: Toggle Spicy / Regular Stock
  const toggleModifier = async (product, modifierName) => {
    const currentStock = product.modifier_stock || { Spicy: true, Regular: true };
    const newStock = { ...currentStock, [modifierName]: !currentStock[modifierName] };

    // If BOTH are out, set the main is_available to false as well
    const isStillAvailable = newStock.Spicy || newStock.Regular;

    try {
      const response = await fetch(`http://192.168.0.102:8000/api/admin/products/${product.id}/modifier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ 
          modifier_stock: newStock,
          is_available: isStillAvailable // <--- Syncs the global status
        })
      });
      if (response.ok) {
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, modifier_stock: newStock, is_available: isStillAvailable } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling modifier:", error);
    }
  };


    const handleSaveProduct = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('category_id', newProduct.category_id);
    formData.append('price', newProduct.price);
    formData.append('is_weighted', newProduct.is_weighted ? 1 : 0);
    formData.append('size', newProduct.size || '');
    formData.append('is_free_with_combo', newProduct.is_free_with_combo ? 1 : 0);
    
    if (newProduct.image) {
      formData.append('image', newProduct.image);
    }

    // Determine the URL based on whether we are editing or adding
    const url = editingProductId 
      ? `http://192.168.0.102:8000/api/admin/products/${editingProductId}/update`
      : 'http://192.168.0.102:8000/api/admin/products';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewProduct({ name: '', category_id: '', price: '', is_weighted: false, size: '', is_free_with_combo: false, image: null });
        setEditingProductId(null); 
        fetchProducts(); 
      } else {
        const errorData = await response.json();
        // Show the exact error on screen
        const errorMessage = errorData.errors 
          ? Object.values(errorData.errors).flat().join('\n') 
          : errorData.message;
        alert("Validation Error:\n" + errorMessage);
        console.error("Laravel Error:", errorData);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Network error. Check console.");
    }
  };

  const openEditModal = (product) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      is_weighted: product.is_weighted,
      size: product.size || '',
      is_free_with_combo: product.is_free_with_combo || false,
      image: null
    });
    setIsAddModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-[#1e1e24] flex items-center justify-center text-white font-sans">
        <form onSubmit={handleLogin} className="bg-[#2a2a32] p-8 rounded-2xl shadow-2xl border border-[#353540] w-96 text-center">
          <h1 className="text-3xl font-black text-[#7b1e23] italic mb-2">Valéchon</h1>
          <p className="text-gray-400 mb-6 font-semibold">Admin Panel Login</p>
          
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            className="w-full bg-[#1e1e24] border border-[#404050] rounded-xl p-4 text-white focus:outline-none focus:border-yellow-500 mb-4 text-center tracking-widest"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button type="submit" className="w-full bg-[#7b1e23] text-white font-bold py-3 rounded-xl hover:bg-[#5a1519] transition-colors">
            LOGIN
          </button>
          
          <Link to="/" className="block mt-4 text-gray-400 text-sm hover:text-white">&larr; Back to POS</Link>
        </form>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-[#1e1e24] text-gray-200 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 border-b border-[#353540] pb-4 md:pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#7b1e23] italic tracking-wider">Valéchon</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest mt-1 text-xs md:text-sm">Admin Dashboard</p>
          </div>
          <Link to="/" className="text-yellow-500 font-bold hover:underline bg-[#2a2a32] px-4 py-2 rounded-lg border border-[#353540] text-sm md:text-base w-full md:w-auto text-center">
            &larr; Back to POS
          </Link>
        </div>

        {/* Products Container */}
        <div className="bg-[#2a2a32] p-3 md:p-6 rounded-2xl border border-[#353540] shadow-lg">
          <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-[#353540] pb-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-200">Menu Management</h2>
            <button 
              onClick={() => {
                setEditingProductId(null);
                setNewProduct({ name: '', category_id: '', price: '', is_weighted: false, size: '', is_free_with_combo: false, image: null });
                setIsAddModalOpen(true);
              }}
              className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm shadow-md"
            >
              + Add Product
            </button>
          </div>
          
          <div className="w-full">
            
            {/* DESKTOP TABLE HEADER (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-12 text-gray-400 text-sm font-bold uppercase tracking-wider border-b border-[#353540] pb-3 px-4">
              <div className="col-span-3">Product Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-right">Action</div>
            </div>

            {/* PRODUCT LIST (Cards on Mobile, Rows on Desktop) */}
            <div className="divide-y divide-[#353540]">
              {products.map((product) => (
                <div key={product.id} className="py-4 px-2 md:px-4 flex flex-col md:grid md:grid-cols-12 md:items-center hover:bg-[#353540]/30 transition-colors gap-3 md:gap-0">
                  
                  {/* Name & Category (Flex row on mobile) */}
                  <div className="md:col-span-3 flex justify-between md:block items-start">
                    <span className="font-bold text-white text-base md:text-sm">
                      {product.name} {product.size ? `(${product.size})` : ''}
                    </span>
                    <span className="md:hidden text-xs text-gray-400 bg-[#1e1e24] px-2 py-1 rounded">{product.category?.name || 'N/A'}</span>
                  </div>
                  
                  {/* Category (Desktop only) */}
                  <div className="hidden md:block md:col-span-2 text-gray-400 text-sm">{product.category?.name || 'N/A'}</div>
                  
                  {/* Price */}
                  <div className="md:col-span-2 font-semibold text-green-400 text-sm md:text-base">
                    ₱{parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    {product.is_weighted && '/kg'}
                  </div>
                  
                  {/* Status */}
                  <div className="md:col-span-2 md:text-center flex md:block items-center gap-2">
                    <span className="text-xs text-gray-500 md:hidden uppercase font-bold">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      product.is_available 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {product.is_available ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-3 md:text-right mt-2 md:mt-0 flex flex-col md:flex-row justify-end gap-2 items-center">
                    
                    {/* Edit Button */}
                    <button 
                      onClick={() => openEditModal(product)}
                      className="w-full md:w-auto px-3 py-2 rounded-lg text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      Edit
                    </button>

                    {product.name.toLowerCase().includes('lechon') || product.name.toLowerCase().includes('combo') || product.name.toLowerCase().includes('roll') ? (
                      <div className="flex gap-2 md:justify-end">
                        <button 
                          onClick={() => toggleModifier(product, 'Regular')}
                          className={`flex-1 md:flex-none px-3 py-2 md:py-1 rounded-lg text-sm font-bold border transition-colors ${
                            (product.modifier_stock?.Regular ?? true)
                              ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-white' 
                              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          Reg: {(product.modifier_stock?.Regular ?? true) ? 'IN' : 'OUT'}
                        </button>
                        <button 
                          onClick={() => toggleModifier(product, 'Spicy')}
                          className={`flex-1 md:flex-none px-3 py-2 md:py-1 rounded-lg text-sm font-bold border transition-colors ${
                            (product.modifier_stock?.Spicy ?? true)
                              ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-white' 
                              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          Spicy: {(product.modifier_stock?.Spicy ?? true) ? 'IN' : 'OUT'}
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => toggleProduct(product.id)}
                        className={`w-full md:w-auto px-4 py-2 rounded-lg font-bold text-sm transition-colors border ${
                          product.is_available 
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/30' 
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border-green-500/30'
                        }`}
                      >
                        {product.is_available ? 'Mark Out of Stock' : 'Mark Available'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

            {/* ADD/EDIT PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-[#2a2a32] rounded-2xl shadow-2xl w-full max-w-2xl border border-[#404050] max-h-[90vh] flex flex-col">
            
            <div className="bg-[#1e1e24] p-4 flex justify-between items-center border-b border-[#353540] rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => { setIsAddModalOpen(false); setEditingProductId(null); }} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-3 overflow-y-auto flex-1">
              
              {/* Product Name */}
              <div>
                <label className="block text-gray-400 font-bold mb-1 text-sm">Product Name</label>
                <input 
                  type="text" required
                  className="w-full bg-[#1e1e24] border border-[#404050] rounded-xl p-3 text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="e.g. Puso, Pepsi, Extra Rice"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-gray-400 font-bold mb-1 text-sm">Category</label>
                <select 
                  required
                  className="w-full bg-[#1e1e24] border border-[#404050] rounded-xl p-3 text-white focus:border-yellow-500 focus:outline-none"
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

                            {/* Price and Size Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-1 text-sm">Price (₱)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full bg-[#1e1e24] border border-[#404050] rounded-xl p-2 text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1 text-sm">Size (Optional)</label>
                  <select 
                    className="w-full bg-[#1e1e24] border border-[#404050] rounded-xl p-2 text-white focus:border-yellow-500 focus:outline-none"
                    value={newProduct.size}
                    onChange={(e) => {
                      const selectedSize = e.target.value;
                      // Auto-check if 8oz, 330ml, or 230ml
                      const isFreeSize = ['8oz', '330ml', '230ml'].includes(selectedSize);
                      setNewProduct({
                        ...newProduct, 
                        size: selectedSize,
                        is_free_with_combo: isFreeSize
                      });
                    }}
                  >
                    <option value="">No Size (Standard)</option>
                    <option value="8oz">8oz</option>
                    <option value="12oz">12oz</option>
                    <option value="330ml">330ml</option>
                    <option value="230ml">230ml</option>
                    <option value="1000ml">1000ml</option>
                  </select>
                </div>
              </div>


                            {/* Checkboxes Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  const isFreeSize = ['8oz', '330ml', '230ml'].includes(newProduct.size);
                  return (
                    <div className={`flex items-center gap-3 p-2 rounded-xl border border-[#404050] ${isFreeSize ? 'bg-green-900/20 opacity-70' : 'bg-[#1e1e24]'}`}>
                      <input 
                        type="checkbox" 
                        id="is_free_with_combo"
                        className="w-5 h-5 accent-yellow-500 disabled:opacity-50"
                        checked={newProduct.is_free_with_combo}
                        disabled={isFreeSize}
                        onChange={(e) => setNewProduct({...newProduct, is_free_with_combo: e.target.checked})}
                      />
                      <label htmlFor="is_free_with_combo" className={`text-xs font-semibold ${isFreeSize ? 'text-green-400' : 'text-gray-300'}`}>
                        {isFreeSize ? `Auto-Free (${newProduct.size})` : 'Free with Combo?'}
                      </label>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-3 bg-[#1e1e24] p-2 rounded-xl border border-[#404050]">
                  <input 
                    type="checkbox" 
                    id="is_weighted"
                    className="w-5 h-5 accent-yellow-500"
                    checked={newProduct.is_weighted}
                    onChange={(e) => setNewProduct({...newProduct, is_weighted: e.target.checked})}
                  />
                  <label htmlFor="is_weighted" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Sell by weight?
                  </label>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-gray-400 font-bold mb-1 text-sm">Product Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="w-full bg-[#1e1e24] border border-[#404050] rounded-xl p-2 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#7b1e23] file:text-white hover:file:bg-[#5a1519]"
                  onChange={(e) => setNewProduct({...newProduct, image: e.target.files[0]})}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingProductId(null); }}
                  className="flex-1 bg-[#353540] text-gray-300 font-bold py-3 rounded-xl hover:bg-[#404050] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-md"
                >
                  Save Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
