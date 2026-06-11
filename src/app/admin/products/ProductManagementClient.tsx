"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Check,
  Search,
  Image as ImageIcon,
  AlertTriangle,
  Star,
  Sparkles,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/admin-products";
import MultiImageUpload from "@/components/MultiImageUpload";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  costPrice: number;
  categoryId: string;
  ageGroup: string;
  images: string[];
  stock: number;
  benefits: string;
  featured: boolean;
  category: Category;
}

interface ProductManagementClientProps {
  initialProducts: Product[];
  categories: Category[];
}

const AGE_GROUPS = ["1-3 Years", "3-5 Years", "5-7 Years", "6-12 Years", "Parents", "All Ages"];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ProductManagementClient({
  initialProducts,
  categories,
}: ProductManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [formState, setFormState] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    costPrice: 0,
    categoryId: "",
    ageGroup: "",
    images: [] as string[],
    stock: 0,
    benefits: "",
    featured: false,
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Notification states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Auto-generate slug on title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormState((prev) => ({
      ...prev,
      title: val,
      slug: isSlugManuallyEdited ? prev.slug : slugify(val),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIsSlugManuallyEdited(true);
    setFormState((prev) => ({
      ...prev,
      slug: slugify(val),
    }));
  };

  // Open Dialog for Create
  const handleOpenCreate = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setFormState({
      title: "",
      slug: "",
      description: "",
      price: 0,
      costPrice: 0,
      categoryId: categories[0]?.id || "",
      ageGroup: AGE_GROUPS[0],
      images: [],
      stock: 10,
      benefits: "",
      featured: false,
    });
    setIsSlugManuallyEdited(false);
    setModalMode("create");
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  // Open Dialog for Edit
  const handleOpenEdit = (product: Product) => {
    setErrorMsg("");
    setSuccessMsg("");
    setFormState({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice || 0,
      categoryId: product.categoryId,
      ageGroup: product.ageGroup,
      images: product.images,
      stock: product.stock,
      benefits: product.benefits,
      featured: product.featured,
    });
    setIsSlugManuallyEdited(true);
    setModalMode("edit");
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  // Open Delete dialog
  const handleOpenDelete = (product: Product) => {
    setErrorMsg("");
    setSuccessMsg("");
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  // Submit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formState.title.trim()) {
      setErrorMsg("Product title is required.");
      return;
    }
    if (!formState.slug.trim()) {
      setErrorMsg("Product slug is required.");
      return;
    }
    if (formState.price <= 0) {
      setErrorMsg("Product price must be a positive number.");
      return;
    }
    if (formState.costPrice < 0) {
      setErrorMsg("Product buyin cost cannot be negative.");
      return;
    }
    if (formState.stock < 0) {
      setErrorMsg("Product stock cannot be negative.");
      return;
    }
    if (formState.images.length === 0) {
      setErrorMsg("At least one product image is required.");
      return;
    }
    if (!formState.description.trim()) {
      setErrorMsg("Product description is required.");
      return;
    }
    if (!formState.benefits.trim()) {
      setErrorMsg("Product benefits are required.");
      return;
    }

    startTransition(async () => {
      let res;
      if (modalMode === "create") {
        res = await createProduct(formState);
      } else {
        if (!selectedProduct) return;
        res = await updateProduct(selectedProduct.id, formState);
      }

      if (res.success) {
        setSuccessMsg(
          `Product "${formState.title}" was successfully ${
            modalMode === "create" ? "created" : "updated"
          }.`
        );
        setIsFormOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to save product.");
      }
    });
  };

  // Execute Delete
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setErrorMsg("");

    startTransition(async () => {
      const res = await deleteProduct(selectedProduct.id);
      if (res.success) {
        setSuccessMsg(`Product "${selectedProduct.title}" was successfully deleted.`);
        setIsDeleteOpen(false);
        setSelectedProduct(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to delete product.");
      }
    });
  };

  // Client-side filtering
  const filteredProducts = initialProducts.filter(
    (prod) =>
      prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.benefits.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Low & Out of stock counts
  const outOfStockCount = initialProducts.filter((p) => p.stock === 0).length;
  const lowStockCount = initialProducts.filter((p) => p.stock > 0 && p.stock <= 5).length;

  return (
    <div className="relative">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800 font-sans">Products Inventory</h2>
            <p className="text-xs text-slate-500">{initialProducts.length} items registered</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm shadow-blue-100 font-sans cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-650 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">Total Products</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{initialProducts.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100/50 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">Out of Stock</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{outOfStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">Low Stock (1-5)</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-sans flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Filter input */}
      <div className="mb-6 relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search products by title, category, description or benefits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      {/* Grid view empty state */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 font-sans">No Products Found</h3>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            No matching items were found for &quot;{searchQuery}&quot;. Try editing your query.
          </p>
        </div>
      )}

      {/* Desktop view (Table layout) */}
      {filteredProducts.length > 0 && (
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider font-sans">
                <th className="px-6 py-4 w-24">Image</th>
                <th className="px-6 py-4">Title & Slug</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Age Group</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-sans">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-150 bg-slate-50 shadow-sm shrink-0">
                      {prod.images?.[0] ? (
                        <Image
                          src={prod.images[0]}
                          alt={prod.title}
                          fill
                          className="object-cover"
                          sizes="60px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-100">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[240px]">
                    <div className="font-semibold text-slate-900 truncate" title={prod.title}>
                      {prod.title}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate" title={prod.slug}>
                      {prod.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-650 border border-slate-100">
                      {prod.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{prod.ageGroup}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">৳{prod.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        prod.stock === 0
                          ? "bg-red-50 text-red-700 border-red-100"
                          : prod.stock <= 5
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}
                    >
                      {prod.stock === 0 ? "Out of Stock" : `${prod.stock} Units`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {prod.featured ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <Star className="w-3.5 h-3.5 fill-blue-600" />
                        <span>Featured</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Standard</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="h-10 w-10 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(prod)}
                        className="h-10 w-10 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile & Tablet view (Card stack layout) */}
      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden mb-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-150 bg-slate-50 shadow-sm shrink-0">
                    {prod.images?.[0] ? (
                      <Image
                        src={prod.images[0]}
                        alt={prod.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-100">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate" title={prod.title}>
                      {prod.title}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate" title={prod.slug}>
                      {prod.slug}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-1">{prod.ageGroup}</div>
                  </div>
                </div>
                {prod.featured && (
                  <span className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-blue-600" />
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-b border-slate-50 py-2.5 my-1">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Category</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{prod.category.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Price</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">৳{prod.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Stock</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 border ${
                      prod.stock === 0
                        ? "bg-red-50 text-red-700 border-red-100"
                        : prod.stock <= 5
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}
                  >
                    {prod.stock === 0 ? "Out" : `${prod.stock} Units`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="h-12 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl flex items-center gap-2 text-xs font-semibold font-sans cursor-pointer focus:outline-none"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenDelete(prod)}
                  className="h-12 px-4 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl flex items-center gap-2 text-xs font-semibold font-sans cursor-pointer focus:outline-none"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT PRODUCT MODAL DIALOG OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-800 font-sans">
                {modalMode === "create" ? "Add New Product" : "Edit Product"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-100 text-xs rounded-xl font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Product Multi Image Upload component */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-sans">
                  Product Images (Max 5) <span className="text-red-500">*</span>
                </label>
                <MultiImageUpload
                  value={formState.images}
                  onChange={(urls) => setFormState((prev) => ({ ...prev, images: urls }))}
                />
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label htmlFor="product-title" className="text-xs font-bold text-slate-700 font-sans">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-title"
                    type="text"
                    placeholder="e.g. Brain Development Blocks"
                    value={formState.title}
                    onChange={handleTitleChange}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label htmlFor="product-slug" className="text-xs font-bold text-slate-700 font-sans">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-slug"
                    type="text"
                    placeholder="e.g. brain-development-blocks"
                    value={formState.slug}
                    onChange={handleSlugChange}
                    className="w-full h-12 px-4 border border-slate-200 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label htmlFor="product-price" className="text-xs font-bold text-slate-700 font-sans">
                    Price (৳ BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    placeholder="e.g. 750"
                    value={formState.price || ""}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                    min="1"
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Wholesale Cost */}
                <div className="space-y-1.5">
                  <label htmlFor="product-costPrice" className="text-xs font-bold text-slate-700 font-sans">
                    Wholesale Buy-in Cost (৳ BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-costPrice"
                    type="number"
                    placeholder="e.g. 500"
                    value={formState.costPrice === 0 ? "0" : formState.costPrice || ""}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))
                    }
                    min="0"
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label htmlFor="product-stock" className="text-xs font-bold text-slate-700 font-sans">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-stock"
                    type="number"
                    placeholder="e.g. 15"
                    value={formState.stock === 0 ? "0" : formState.stock || ""}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, stock: parseInt(e.target.value, 10) || 0 }))
                    }
                    min="0"
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label htmlFor="product-category" className="text-xs font-bold text-slate-700 font-sans">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="product-category"
                    value={formState.categoryId}
                    onChange={(e) => setFormState((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age Group */}
                <div className="space-y-1.5">
                  <label htmlFor="product-age" className="text-xs font-bold text-slate-700 font-sans">
                    Age Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="product-age"
                    value={formState.ageGroup}
                    onChange={(e) => setFormState((prev) => ({ ...prev, ageGroup: e.target.value }))}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {AGE_GROUPS.map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="product-description" className="text-xs font-bold text-slate-700 font-sans">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="product-description"
                  placeholder="Explain what the product is, how it works, and what makes it special..."
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Benefits */}
              <div className="space-y-1.5">
                <label htmlFor="product-benefits" className="text-xs font-bold text-slate-700 font-sans">
                  Benefits / Skills Developed (Newline separated) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="product-benefits"
                  placeholder="e.g.&#10;Enhances spatial reasoning & geometric coordination&#10;Promotes active logic planning&#10;Develops child posturing tripod writing grip"
                  value={formState.benefits}
                  onChange={(e) => setFormState((prev) => ({ ...prev, benefits: e.target.value }))}
                  rows={3}
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Featured toggle flag */}
              <div className="flex items-center gap-3 py-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <input
                  id="product-featured"
                  type="checkbox"
                  checked={formState.featured}
                  onChange={(e) => setFormState((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="h-6 w-6 text-blue-600 border-slate-350 rounded-md focus:ring-blue-500 shrink-0 cursor-pointer"
                />
                <label htmlFor="product-featured" className="text-xs font-bold text-slate-700 cursor-pointer select-none font-sans">
                  Feature this product on homepage best sellers banner
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="h-12 px-5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer font-sans focus:outline-none"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm font-sans cursor-pointer focus:outline-none"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {isDeleteOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 font-sans">Delete Product?</h3>
                <p className="text-sm text-slate-500 mt-1 font-sans">
                  Are you sure you want to delete <span className="font-semibold text-slate-700">&quot;{selectedProduct.title}&quot;</span>?
                  This action cannot be undone and will clear it from customer checkout orders.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl font-sans leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="h-12 px-5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer font-sans focus:outline-none"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm font-sans cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
