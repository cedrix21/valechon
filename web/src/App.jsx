import { useState, useEffect } from 'react';
import imgMountainDew from './assets/mountain-dew.jpg';
import imgNatureSpring from './assets/nature-spring.jpg';
import imgRoyal from './assets/royal.jpg';
import imgCoke from './assets/coke.jpg';
import imgLechonBelly from './assets/lechon-belly.jpg';
import imgLechonRoll from './assets/lechon-roll.jpg';
import imgLechonSliced from './assets/lechon-sliced.jpg';
import imgCombo from './assets/combo.jpg';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [activeWeightId, setActiveWeightId] = useState(null);
  const [weightInput, setWeightInput] = useState('2.0');
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [printItems, setPrintItems] = useState([]);
  const [modifierModalItem, setModifierModalItem] = useState(null);
  const [comboStep, setComboStep] = useState('spice');
  const [selectedSpice, setSelectedSpice] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isClearCartOpen, setIsClearCartOpen] = useState(false);

  useEffect(() => {
    fetch('http://192.168.0.102:8000/api/menu')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setActiveCategory(data[0].id);
        }
      })
      .catch(error => console.error("Error fetching menu:", error));
  }, []);

  const getProductImage = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('combo')) return imgCombo;
    if (name.includes('roll')) return imgLechonRoll;
    if (name.includes('1/4') || name.includes('1/2') || name.includes('1 kg')) return imgLechonSliced;
    if (name.includes('coke')) return imgCoke;
    if (name.includes('royal')) return imgRoyal;
    if (name.includes('nature') || name.includes('water')) return imgNatureSpring;
    if (name.includes('upgrade') || name.includes('dew') || name.includes('12oz')) return imgMountainDew;
    return imgLechonBelly; 
  };

  const handleItemTap = (product) => {
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('combo')) {
      const stock = product.modifier_stock || { Spicy: true, Regular: true };
      if (!stock.Spicy && !stock.Regular) {
         alert("Sorry, this combo is completely out of stock.");
         return;
      }
      setModifierModalItem({ ...product, type: 'combo' });
      setComboStep('spice');
      setSelectedSpice('');
      return;
    }
    if (product.is_weighted) {
      const stock = product.modifier_stock || { Spicy: true, Regular: true };
      if (!stock.Spicy && !stock.Regular) {
         alert("Sorry, this item is completely out of stock.");
         return;
      }
      setModifierModalItem({ ...product, type: 'lechon' });
      return;
    }
    if (nameLower.includes('lechon')) {
      setModifierModalItem({ ...product, type: 'lechon' });
      return;
    }
    addToCartDirectly(product, 'Regular');
  };

  const addToCartDirectly = (product, modifierChoice, weight = null) => {
    const existingItemIndex = cart.findIndex(
      item => item.id === product.id && item.weight === weight && item.modifiers === modifierChoice
    );
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      const itemTotal = weight ? parseFloat(product.price) * weight : null;
      setCart([...cart, { ...product, quantity: 1, weight: weight, total: itemTotal, modifiers: modifierChoice }]);
    }
  };

  const confirmModifier = (modifierChoice) => {
    if (modifierModalItem.type === 'combo') {
      if (comboStep === 'spice') {
        setSelectedSpice(modifierChoice);
        setComboStep('drink');
        return;
      }
      const finalModifier = `${selectedSpice} | ${modifierChoice}`;
      addToCartDirectly(modifierModalItem, finalModifier);
      setModifierModalItem(null);
      setComboStep('spice');
      setSelectedSpice('');
      return;
    }
    if (modifierModalItem.is_weighted) {
      setSelectedSpice(modifierChoice);
      setActiveWeightId(modifierModalItem.id);
      setWeightInput('2.0');
      setIsEditingWeight(false);
    } else {
      addToCartDirectly(modifierModalItem, modifierChoice);
    }
    setModifierModalItem(null);
  };

  const confirmWeight = (product) => {
    const weightNum = parseFloat(weightInput);
    if (isNaN(weightNum) || weightNum <= 0) return;
    const itemTotal = parseFloat(product.price) * weightNum;
    const finalModifier = selectedSpice || 'Regular'; 
    setCart([...cart, { ...product, quantity: 1, weight: weightNum, total: itemTotal, modifiers: finalModifier }]);
    setActiveWeightId(null);
    setSelectedSpice('');
  };

  const updateQuantity = (index, change) => {
    const newCart = [...cart];
    if (newCart[index].weight) return;
    newCart[index].quantity += change;
    if (newCart[index].quantity <= 0) newCart.splice(index, 1);
    setCart(newCart);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const clearCart = () => setIsClearCartOpen(true);
  const confirmClearCart = () => { setCart([]); setIsClearCartOpen(false); };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.weight ? parseFloat(item.total) : (parseFloat(item.price) * item.quantity);
      return total + itemTotal;
    }, 0).toFixed(2);
  };

  const calculateChange = () => {
    const total = parseFloat(calculateTotal());
    const tendered = parseFloat(cashTendered) || 0;
    return (tendered - total).toFixed(2);
  };

  const handleOrderSuccess = (orderData) => {
    setIsCheckoutOpen(false);
    setIsMobileCartOpen(false);
    setSuccessOrderData(orderData);
    setPrintItems([...cart]);
    setCart([]); 
    setCashTendered('');
    setCustomerName('');
    setTimeout(() => setSuccessOrderData(null), 5000);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#1e1e24] font-sans overflow-hidden text-gray-200 relative mx-auto max-w-[1920px] flex-shrink-0">
      
      {/* HEADER */}
      <header className="pos-header">
        <div className="flex items-center justify-between w-full lg:w-auto gap-3 lg:gap-6">
          {/* Group Logo and Slogan vertically */}
          <div className="flex flex-col items-start justify-center">
            <h1 className="text-2xl lg:text-3xl 2xl:text-4xl font-black tracking-wider text-white italic drop-shadow-md leading-none">Valéchon</h1>
            {/* Added pl-1 lg:pl-0 and 2xl:pl-2 to align with the italic V */}
            <span className="text-xs lg:text-sm font-bold text-gray-300 uppercase tracking-widest hidden lg:block mt-1 pl-1 lg:pl-0 2xl:pl-2">Sulit ug lamian</span>
          </div>
          <div className="flex gap-2 ml-auto lg:ml-4">
             <a href="/report" target="_blank" className="text-xs lg:text-sm bg-[#5a1519] text-yellow-500 px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-lg border border-yellow-500 hover:bg-[#4a1014] transition-colors font-bold tracking-wide shadow-sm">REPORTS</a>
             <a href="/admin" target="_blank" className="text-xs lg:text-sm bg-[#353540] text-gray-300 px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-lg border border-[#404050] hover:bg-[#404050] transition-colors font-bold tracking-wide shadow-sm">ADMIN</a>
          </div>
        </div>
        <div className="flex gap-2 lg:gap-4 items-center w-full lg:w-auto justify-between lg:justify-end">
          <input type="text" placeholder="Customer Name" className="px-3 lg:px-4 py-2 lg:py-2 w-full lg:w-64 xl:w-72 rounded-xl bg-[#5a1519] text-white placeholder-gray-400 border border-[#4a1014] focus:outline-none focus:border-yellow-500 text-sm lg:text-base shadow-inner" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <div className="flex bg-[#5a1519] rounded-xl p-1 lg:p-1.5 border border-[#4a1014] shadow-inner shrink-0">
            <button className={`px-4 lg:px-10 py-2 lg:py-4 rounded-lg text-xs lg:text-base font-bold transition-all ${orderType === 'dine-in' ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-300 hover:text-white'}`} onClick={() => setOrderType('dine-in')}>DINE IN</button>
            <button className={`px-4 lg:px-10 py-2 lg:py-4 rounded-lg text-xs lg:text-base font-bold transition-all ${orderType === 'takeout' ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-300 hover:text-white'}`} onClick={() => setOrderType('takeout')}>TAKE OUT</button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="pos-main">
        
        {/* LEFT: CATEGORIES */}
        <div className="pos-sidebar">
          {categories.map(category => (
            <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`px-6 py-4 lg:px-2 lg:py-3 lg:w-full lg:min-h-[70px] xl:min-h-[85px] rounded-xl flex flex-col items-center justify-center font-bold text-sm lg:text-base xl:text-lg text-center transition-all shrink-0 ${activeCategory === category.id ? 'bg-[#7b1e23] text-white shadow-lg border-b-4 border-yellow-500' : 'bg-[#353540] text-gray-400 hover:bg-[#404050]'}`}>
              <span className="leading-tight">{category.name}</span>
            </button>
          ))}
        </div>

        {/* CENTER: ITEM GRID */}
        <div className="flex-1 overflow-y-auto">
          <div className="pos-grid">
            {categories.find(c => c.id === activeCategory)?.products.map(product => {
              const isLechon = product.name.toLowerCase().includes('lechon') && !product.is_weighted;
              const stock = product.modifier_stock || { Spicy: true, Regular: true };
              const isCompletelyOut = !product.is_available || (isLechon && !stock.Spicy && !stock.Regular);

              if (isCompletelyOut) {
                return (
                  <div key={product.id} className="flex flex-col cursor-not-allowed">
                    <div className="bg-[#2a2a32] rounded-xl overflow-hidden border-2 border-[#353540] shadow-md relative h-[208px] lg:h-[240px] 2xl:h-[320px]">
                      <div className="h-32 lg:h-40 2xl:h-56 bg-[#353540] overflow-hidden flex items-center justify-center p-2 opacity-50 grayscale">
                        <img src={product.image_path ? `http://192.168.0.102:8000/storage/${product.image_path}` : getProductImage(product.name)} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div className="p-3 text-center bg-[#2a2a32] border-t border-[#353540] opacity-50">
                        <span className="font-bold text-sm text-gray-400 block mb-1 leading-tight">{product.name}</span>
                        <span className="text-gray-500 font-extrabold text-lg">₱{product.is_weighted ? `${parseFloat(product.price)}/kg` : parseFloat(product.price).toFixed(2)}</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                        <span className="text-red-500 font-extrabold text-sm uppercase tracking-wider bg-[#1e1e24] px-4 py-2 rounded-full border border-red-500/50 shadow-lg">Not Available</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={product.id} className="flex flex-col">
                  <button onClick={() => handleItemTap(product)} className={`bg-[#2a2a32] rounded-xl overflow-hidden shadow-md border-2 transition-all group hover:-translate-y-1 ${activeWeightId === product.id ? 'border-yellow-500' : 'border-[#353540] hover:border-[#7b1e23]'}`}>
                    <div className="h-32 lg:h-40 2xl:h-56 bg-[#353540] overflow-hidden flex items-center justify-center p-2">
                      <img src={product.image_path ? `http://192.168.0.102:8000/storage/${product.image_path}` : getProductImage(product.name)} alt={product.name} className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="p-3 lg:p-4 2xl:p-6 text-center bg-[#2a2a32] border-t border-[#353540]">
                      <span className="font-bold text-sm lg:text-lg 2xl:text-2xl text-white block mb-1 lg:mb-2 leading-tight">{product.name}</span>
                      <span className="text-yellow-500 font-extrabold text-lg lg:text-xl 2xl:text-3xl">₱{product.is_weighted ? `${parseFloat(product.price)}/kg` : parseFloat(product.price).toFixed(2)}</span>
                    </div>
                  </button>

                  {activeWeightId === product.id && (
                    <div className="bg-[#353540] p-4 mt-2 rounded-xl shadow-lg border border-yellow-500/50 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <span className="text-xs font-bold text-gray-300">Weight (kg) - <span className={selectedSpice === 'Spicy' ? 'text-red-400' : 'text-blue-400'}>{selectedSpice || 'Regular'}</span></span>
                      {isEditingWeight ? (
                        <input type="number" step="0.1" autoFocus className="w-full bg-[#1e1e24] border border-yellow-500 rounded p-2 text-xl font-extrabold text-center text-white focus:outline-none" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onBlur={() => setIsEditingWeight(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingWeight(false)} />
                      ) : (
                        <button onClick={() => setIsEditingWeight(true)} className="w-full bg-[#1e1e24] border border-dashed border-gray-500 rounded p-2 text-xl font-extrabold text-white hover:border-yellow-500 flex justify-center items-center gap-2">{weightInput} kg <span className="text-[10px] text-yellow-500 font-bold uppercase">(Edit)</span></button>
                      )}
                      <button onClick={() => confirmWeight(product)} className="w-full bg-[#7b1e23] text-white text-sm font-bold py-2 rounded hover:bg-[#5a1519] mt-1 transition-colors">Add to Cart</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: CART */}
        <div className={`pos-cart ${isMobileCartOpen ? 'is-open' : ''}`}>
          <div className="pos-cart-header">
            <h2 className="text-lg font-bold text-white">Current Order</h2>
            <span className="bg-[#7b1e23] text-white font-bold px-3 py-1 rounded-full text-xs uppercase shadow-sm">{orderType}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-20 h-20 bg-[#353540] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <p className="font-bold text-gray-400">No Order</p>
                <p className="text-xs mt-1">Tap the product to add to order</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {cart.map((item, index) => (
                  <li key={index} className="flex justify-between items-center bg-[#353540] p-3 rounded-xl border border-[#404050]">
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">
                        {item.name} 
                        {item.modifiers && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${item.modifiers.includes('Spicy') ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>{item.modifiers}</span>
                        )}
                      </div>
                      {item.weight ? (
                         <div className="text-xs text-yellow-500 mt-1 font-semibold">{item.weight} kg</div>
                      ) : (
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(index, -1)} className="w-6 h-6 bg-[#1e1e24] rounded flex items-center justify-center font-bold text-gray-300 hover:text-white">-</button>
                          <span className="text-sm font-bold text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(index, 1)} className="w-6 h-6 bg-[#1e1e24] rounded flex items-center justify-center font-bold text-gray-300 hover:text-white">+</button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">₱{(item.weight ? item.total : item.price * item.quantity).toFixed(2)}</div>
                      <button onClick={() => removeFromCart(index)} className="text-red-400 text-xs hover:text-red-300 mt-1">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pos-cart-footer">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 font-semibold text-sm">TOTAL</span>
              <span className="total-amount text-3xl font-extrabold text-white">₱{parseFloat(calculateTotal()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={clearCart} className="w-1/3 bg-[#353540] text-gray-300 font-bold py-3 rounded-xl hover:bg-[#404050] transition-colors">Clear</button>
              <button className="w-2/3 bg-[#7b1e23] text-white font-bold text-lg py-3 rounded-xl shadow-lg hover:bg-[#5a1519] transition-colors disabled:bg-gray-600 disabled:text-gray-400" onClick={() => { if(cart.length > 0) setIsCheckoutOpen(true); }} disabled={cart.length === 0}>CHARGE</button>
            </div>
            <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden w-full bg-[#353540] text-white font-bold text-base py-3 rounded-xl border border-[#404050]">&larr; Back to Menu</button>
          </div>
        </div>
      </div>

      {/* ALL MODALS REMAIN EXACTLY THE SAME AS YOUR CURRENT CODE */}
      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}>
          <div className="bg-[#2a2a32] rounded-2xl shadow-2xl w-96 overflow-hidden border border-[#404050]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e1e24] p-4 flex justify-between items-center border-b border-[#353540]">
              <h2 className="text-xl font-bold text-white">Payment</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6 bg-[#1e1e24] py-4 rounded-xl border border-[#353540]">
                <p className="text-gray-400 font-semibold text-sm mb-1 uppercase tracking-wider">Total to pay</p>
                <p className="text-4xl font-extrabold text-yellow-500">₱{parseFloat(calculateTotal()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex gap-2 mb-6">
                {['Cash', 'GCash', 'Maya'].map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${paymentMethod === method ? 'border-yellow-500 bg-[#353540] text-yellow-500' : 'border-[#353540] text-gray-400 hover:bg-[#353540]'}`}>{method}</button>
                ))}
              </div>
              {paymentMethod === 'Cash' && (
                <div className="mb-6">
                  <label className="block text-gray-400 font-bold mb-2 text-sm">Cash Tendered</label>
                  <input type="number" className="w-full bg-[#1e1e24] border border-[#404050] rounded-xl p-4 text-2xl font-bold text-white focus:border-yellow-500 focus:outline-none" placeholder="0.00" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)} />
                  {parseFloat(cashTendered) > 0 && (
                    <div className="mt-4 p-4 bg-[#1e1e24] rounded-xl border border-green-500/30 flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Change:</span>
                      <span className="text-green-400 font-extrabold text-2xl">₱{calculateChange()}</span>
                    </div>
                  )}
                </div>
              )}
              <button className="w-full bg-[#7b1e23] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-[#5a1519] transition-colors disabled:bg-gray-600 disabled:text-gray-400" disabled={paymentMethod === 'Cash' && (!cashTendered || parseFloat(cashTendered) < parseFloat(calculateTotal()))} onClick={async () => {
                  const orderData = { order_type: orderType, customer_name: customerName || 'Walk-in', total_amount: calculateTotal(), payment_method: paymentMethod, cash_tendered: paymentMethod === 'Cash' ? parseFloat(cashTendered) : calculateTotal(), change_amount: paymentMethod === 'Cash' ? parseFloat(calculateChange()) : 0, items: cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.price, weight: item.weight, modifiers: item.modifiers })) };
                  try {
                    const response = await fetch('http://192.168.0.102:8000/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(orderData) });
                    const data = await response.json();
                    if (response.ok) { handleOrderSuccess({ order_number: data.order_number, total: calculateTotal(), payment: paymentMethod, change: paymentMethod === 'Cash' ? calculateChange() : 0 }); }
                  } catch (error) { console.error("Error:", error); }
              }}>COMPLETE ORDER</button>
            </div>
          </div>
        </div>
      )}

      {/* Modifier Modal */}
      {modifierModalItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => { setModifierModalItem(null); setComboStep('spice'); setSelectedSpice(''); }}>
          <div className="bg-[#2a2a32] rounded-2xl shadow-2xl w-[420px] p-6 border border-[#404050]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white text-center mb-2">{modifierModalItem.type === 'combo' ? (comboStep === 'spice' ? 'Step 1: Select Flavor' : 'Step 2: Select Drink') : 'Select Flavor'}</h2>
            <p className="text-gray-400 text-center mb-6 font-semibold">{modifierModalItem.name}</p>
            {modifierModalItem.type === 'combo' && comboStep === 'spice' ? (
              <div className="flex gap-4 mb-4">
                <button onClick={() => confirmModifier('Regular')} disabled={modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Regular} className="flex-1 bg-[#353540] text-white font-bold py-6 rounded-xl hover:bg-[#404050] border-2 border-transparent hover:border-gray-400 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed">{modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Regular ? 'Regular (Out of Stock)' : 'Regular'}</button>
                <button onClick={() => confirmModifier('Spicy')} disabled={modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Spicy} className="flex-1 bg-[#7b1e23] text-white font-bold py-6 rounded-xl hover:bg-[#5a1519] border-2 border-transparent hover:border-red-400 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed">{modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Spicy ? 'Spicy (Out of Stock)' : 'Spicy'}</button>
              </div>
            ) : modifierModalItem.type === 'combo' && comboStep === 'drink' ? (
              <div className="flex gap-4 mb-4">
                <button onClick={() => confirmModifier('Coke')} className="flex-1 bg-[#353540] text-white font-bold py-6 rounded-xl hover:bg-[#404050] border-2 border-transparent hover:border-gray-400 transition-all text-lg">Coke</button>
                <button onClick={() => confirmModifier('Royal')} className="flex-1 bg-[#353540] text-white font-bold py-6 rounded-xl hover:bg-[#404050] border-2 border-transparent hover:border-gray-400 transition-all text-lg">Royal</button>
              </div>
            ) : (
              <div className="flex gap-4 mb-4">
                <button onClick={() => confirmModifier('Regular')} disabled={modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Regular} className="flex-1 bg-[#353540] text-white font-bold py-6 rounded-xl hover:bg-[#404050] border-2 border-transparent hover:border-gray-400 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed">{modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Regular ? 'Regular (Out of Stock)' : 'Regular'}</button>
                <button onClick={() => confirmModifier('Spicy')} disabled={modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Spicy} className="flex-1 bg-[#7b1e23] text-white font-bold py-6 rounded-xl hover:bg-[#5a1519] border-2 border-transparent hover:border-red-400 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed">{modifierModalItem.modifier_stock && !modifierModalItem.modifier_stock.Spicy ? 'Spicy (Out of Stock)' : 'Spicy'}</button>
              </div>
            )}
            <button onClick={() => { setModifierModalItem(null); setComboStep('spice'); setSelectedSpice(''); }} className="w-full bg-transparent text-gray-400 font-bold py-2 rounded-xl hover:text-white transition-colors mt-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successOrderData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setSuccessOrderData(null)}>
          <div className="bg-[#2a2a32] rounded-2xl shadow-2xl w-80 overflow-hidden text-center p-6 border-t-8 border-green-500" onClick={(e) => e.stopPropagation()}>
            <div className="text-green-500 mb-4"><svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
            <h2 className="text-2xl font-extrabold text-white mb-1">Order Paid!</h2>
            <p className="text-gray-400 font-semibold mb-4 text-sm">Order #{successOrderData.order_number}</p>
            <div className="bg-[#1e1e24] rounded-xl p-4 mb-6 text-left border border-[#353540]">
              <div className="flex justify-between mb-2"><span className="text-gray-400">Total:</span><span className="font-bold text-white">₱{parseFloat(successOrderData.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between mb-2"><span className="text-gray-400">Paid via:</span><span className="font-bold text-white">{successOrderData.payment}</span></div>
              {successOrderData.payment === 'Cash' && (<div className="flex justify-between border-t border-[#353540] pt-2 mt-2"><span className="text-gray-400 font-semibold">Change:</span><span className="font-bold text-green-400 text-lg">₱{parseFloat(successOrderData.change).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>)}
            </div>
            <button onClick={() => setSuccessOrderData(null)} className="w-full bg-[#7b1e23] text-white font-bold py-3 rounded-xl hover:bg-[#5a1519] transition-colors">NEW ORDER</button>
          </div>
        </div>
      )}

      {/* Clear Cart Modal */}
      {isClearCartOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] backdrop-blur-sm" onClick={() => setIsClearCartOpen(false)}>
          <div className="bg-[#2a2a32] rounded-2xl shadow-2xl w-80 p-6 border border-[#404050] text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></div>
            <h3 className="text-xl font-bold text-white mb-2">Clear Cart?</h3>
            <p className="text-gray-400 text-sm mb-6">Are you sure you want to remove all items from the current order?</p>
            <div className="flex gap-2">
              <button onClick={() => setIsClearCartOpen(false)} className="flex-1 bg-[#353540] text-white font-bold py-3 rounded-xl hover:bg-[#404050] transition-colors">Cancel</button>
              <button onClick={confirmClearCart} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">Yes, Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Button */}
      {!isMobileCartOpen && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <button onClick={() => setIsMobileCartOpen(true)} className="w-full bg-[#7b1e23] text-white font-bold text-lg py-4 rounded-xl shadow-2xl flex justify-between items-center px-6 border border-[#5a1519]">
            <span>View Order ({cart.reduce((t, i) => t + i.quantity, 0)} items)</span>
            <span>₱{parseFloat(calculateTotal()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </button>
        </div>
      )}

    </div>
  );
}