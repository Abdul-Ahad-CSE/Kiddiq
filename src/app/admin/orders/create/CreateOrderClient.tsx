"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  User,
  MapPin,
  CreditCard,
  ArrowLeft
} from "lucide-react";
import { createOmnichannelOrder } from "@/app/actions/admin-orders";
import type { OrderStatus, VerificationStatus } from "@/generated/prisma/client";

interface CatalogProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
}

interface CreateOrderClientProps {
  products: CatalogProduct[];
  chattogramAreas: string[];
}

interface SelectedItem {
  id: string;
  title: string;
  price: number;
  stock: number;
  quantity: number;
}

const BANGLADESH_DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", "Chandpur",
  "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla", "Dhaka", "Dinajpur", "Faridpur", "Feni",
  "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah",
  "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj",
  "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona",
  "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi",
  "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
  "Tangail", "Thakurgaon"
].sort();

export default function CreateOrderClient({ products, chattogramAreas }: CreateOrderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [channel, setChannel] = useState("Facebook");

  // Cart / Products state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Payment states
  const [paymentOption, setPaymentOption] = useState("COD");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [senderNumber, setSenderNumber] = useState("N/A");
  const [transactionId, setTransactionId] = useState("");

  // Administration states
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("pending");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending_verification");
  const [adminNotes, setAdminNotes] = useState("");

  // Error/Success banner
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Click outside listener for product search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  // Handle product selection search filter
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddProduct = (product: CatalogProduct) => {
    if (product.stock <= 0) {
      setErrorMsg(`Product "${product.title}" is out of stock.`);
      return;
    }

    const existing = selectedItems.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        setErrorMsg(`Cannot add more. Only ${product.stock} units in stock for "${product.title}".`);
        return;
      }
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    }
    setErrorMsg(null);
    setProductSearch("");
    setIsProductDropdownOpen(false);
  };

  const handleQuantityChange = (id: string, value: number, stock: number) => {
    if (value < 1) return;
    if (value > stock) {
      setErrorMsg(`Cannot set quantity to ${value}. Only ${stock} units are in stock.`);
      return;
    }
    setErrorMsg(null);
    setSelectedItems(selectedItems.map(item =>
      item.id === id ? { ...item, quantity: value } : item
    ));
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const isChattogram = district === "Chattogram";
  const isCityArea = isChattogram && chattogramAreas.includes(area);
  const deliveryCharge = isCityArea ? 60 : 120;

  const grandTotal = subtotal + deliveryCharge;

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedItems.length === 0) {
      setErrorMsg("Please select at least one product.");
      return;
    }

    // Prepare action data
    const finalSenderNumber = senderNumber.trim() || "N/A";
    const finalTransactionId = transactionId.trim() || null;
    const finalAdminNotes = `[Channel: ${channel}]${adminNotes.trim() ? ` - ${adminNotes.trim()}` : ""}`;

    startTransition(async () => {
      try {
        const result = await createOmnichannelOrder(
          {
            customerName,
            phone,
            email: email.trim() || null,
            district,
            area,
            fullAddress,
            paymentOption,
            paymentMethod,
            senderNumber: finalSenderNumber,
            transactionId: finalTransactionId,
            verificationStatus,
            orderStatus,
            adminNotes: finalAdminNotes,
          },
          selectedItems.map(item => ({ id: item.id, quantity: item.quantity }))
        );

        if (result.success) {
          setSuccessMsg(`Order successfully created! Order ID: ${result.orderId}`);
          setTimeout(() => {
            router.push("/admin/orders");
            router.refresh();
          }, 1500);
        } else {
          setErrorMsg(result.message || "Failed to create order.");
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Back link */}
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-xs tracking-wider uppercase transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
          Create Omnichannel Order
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create manual orders from social media, POS, phone, or manual walk-in clients.
        </p>
      </div>

      {/* Message Banners */}
      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-500/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800 uppercase tracking-wide">Error Creating Order</h4>
            <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-500/20 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Order Created</h4>
            <p className="text-xs text-emerald-700 mt-1">{successMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Forms) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Section */}
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="h-5 w-5 text-slate-400" />
              Customer Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abir Hasan"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all font-mono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. abir@example.com"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Shipping Info Section */}
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="h-5 w-5 text-slate-400" />
              Shipping Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setArea(""); // Reset area
                  }}
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Area / City Location <span className="text-red-500">*</span>
                </label>
                {isChattogram ? (
                  <select
                    required
                    className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  >
                    <option value="">Select Chattogram Area</option>
                    {chattogramAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttara Sector 4"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="e.g. House 12, Road 4, Sector 4, Uttara, Dhaka"
                  className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Catalog Products Selection */}
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShoppingCart className="h-5 w-5 text-slate-400" />
              Products Selection
            </h3>

            {/* Product Autocomplete Search */}
            <div className="relative" ref={productDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Search & Add Products
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                  placeholder="Search live catalog products by title..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setIsProductDropdownOpen(true);
                  }}
                  onFocus={() => setIsProductDropdownOpen(true)}
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    style={{ minWidth: "48px" }}
                  >
                    <X className="h-5 w-5 mx-auto" />
                  </button>
                )}
              </div>

              {isProductDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border-2 border-slate-900 shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 text-center font-medium">No products match search</div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isOutOfStock}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between items-center text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          onClick={() => handleAddProduct(p)}
                        >
                          <div>
                            <div className="font-bold text-slate-900">{p.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Stock: {isOutOfStock ? (
                                <span className="text-red-600 font-bold uppercase">Out of stock</span>
                              ) : (
                                `${p.stock} units`
                              )}
                            </div>
                          </div>
                          <div className="font-mono font-bold text-slate-900 text-right">
                            ৳{p.price.toLocaleString("en-BD")}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Products Grid List */}
            {selectedItems.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 font-medium uppercase tracking-wider">
                No products selected yet. Use the search bar above to add items.
              </div>
            ) : (
              <div className="border border-slate-200 divide-y divide-slate-200">
                {/* Desktop Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 bg-slate-50 p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <div className="col-span-5">Product Title</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-3 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items */}
                {selectedItems.map((item) => (
                  <div key={item.id} className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-center text-sm text-slate-700">
                    {/* Title & Stock */}
                    <div className="col-span-1 sm:col-span-5 space-y-0.5">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">Available Stock: {item.stock}</div>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-1 sm:col-span-2 text-left sm:text-center font-mono text-slate-900 font-medium">
                      <span className="sm:hidden text-slate-400 text-xs font-bold block uppercase mb-0.5">Unit Price</span>
                      ৳{item.price.toLocaleString("en-BD")}
                    </div>

                    {/* Quantity Selector */}
                    <div className="col-span-1 sm:col-span-3 flex justify-start sm:justify-center items-center gap-2">
                      <div className="sm:hidden text-slate-400 text-xs font-bold block uppercase shrink-0">Qty:</div>
                      <div className="flex items-center border border-slate-200">
                        <button
                          type="button"
                          className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 font-bold transition-colors border-r border-slate-200 text-slate-700 focus:outline-none"
                          style={{ minWidth: "40px" }}
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.stock)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="w-12 h-10 text-center font-bold text-slate-900 focus:outline-none bg-white font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, item.stock)}
                        />
                        <button
                          type="button"
                          className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 font-bold transition-colors border-l border-slate-200 text-slate-700 focus:outline-none"
                          style={{ minWidth: "40px" }}
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.stock)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 focus:outline-none shrink-0 transition-all"
                        onClick={() => handleRemoveProduct(item.id)}
                        title="Remove product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Total Price */}
                    <div className="col-span-1 sm:col-span-2 text-left sm:text-right font-mono font-bold text-slate-900">
                      <span className="sm:hidden text-slate-400 text-xs font-bold block uppercase mb-0.5">Total</span>
                      ৳{(item.price * item.quantity).toLocaleString("en-BD")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar Summary & Settings) */}
        <div className="space-y-6">
          {/* Order Channel & Payment Info */}
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="h-5 w-5 text-slate-400" />
              Channel & Payment
            </h3>

            {/* Sales Channel */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sales Channel <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="Facebook">Facebook</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Phone">Phone</option>
                <option value="Walk-in / POS">Walk-in / POS</option>
                <option value="Website Manual">Website Manual</option>
              </select>
            </div>

            {/* Payment Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Option <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                value={paymentOption}
                onChange={(e) => setPaymentOption(e.target.value)}
              >
                <option value="COD">COD (Advance Delivery Charge + Dues on Delivery)</option>
                <option value="FULL_ADVANCE">Full Advance</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                value={paymentMethod}
                onChange={(e) => {
                  const method = e.target.value;
                  setPaymentMethod(method);
                  if (method === "Cash" || method === "Card") {
                    setSenderNumber("N/A");
                  } else {
                    setSenderNumber(prev => (prev === "N/A" ? "" : prev));
                  }
                }}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
              </select>
            </div>

            {/* Sender Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sender Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 017XXXXXXXX"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all font-mono"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                disabled={paymentMethod === "Cash" || paymentMethod === "Card"}
              />
            </div>

            {/* Transaction ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Transaction ID
              </label>
              <input
                type="text"
                placeholder="e.g. TRX982348"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all font-mono"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
                Will be auto-generated if left blank.
              </p>
            </div>
          </div>

          {/* Administration Settings */}
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              Admin Configuration
            </h3>

            {/* Verification Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Initial Verification Status
              </label>
              <select
                className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all font-semibold"
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Order Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Initial Order Status
              </label>
              <select
                className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all font-semibold"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              >
                <option value="pending_verification">Pending Verification</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Admin Notes / Comments
              </label>
              <textarea
                placeholder="Internal notes regarding courier/customer..."
                className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing Totals Card */}
          <div className="bg-slate-900 text-white border-2 border-slate-950 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-3">
              Order Ledger Totals
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtotal</span>
                <span className="font-mono font-bold">৳{subtotal.toLocaleString("en-BD")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Delivery Charge</span>
                <span className="font-mono font-bold">৳{deliveryCharge.toLocaleString("en-BD")}</span>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-base font-bold text-white">
                <span>Grand Total</span>
                <span className="font-mono text-lg text-emerald-400">৳{grandTotal.toLocaleString("en-BD")}</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 text-[11px] font-medium text-slate-400 space-y-1.5">
              <div className="flex justify-between">
                <span>To Pay Now:</span>
                <span className="font-mono font-bold text-slate-200">
                  ৳{(paymentOption === "COD" ? deliveryCharge : grandTotal).toLocaleString("en-BD")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Due on Delivery:</span>
                <span className="font-mono font-bold text-orange-400">
                  ৳{(paymentOption === "COD" ? subtotal : 0).toLocaleString("en-BD")}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending || selectedItems.length === 0}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-2 border-emerald-500/20"
                style={{ minHeight: "48px" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Omnichannel Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
