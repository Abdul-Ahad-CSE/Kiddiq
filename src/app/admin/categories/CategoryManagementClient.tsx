"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Check,
  Search,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/admin-categories";
import ImageUpload from "@/components/ImageUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  text: string;
}

interface CategoryManagementClientProps {
  initialCategories: Category[];
}

// Helper to convert category name to URL-friendly slug
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/[\s_]+/g, "-") // replace spaces/underscores with hyphens
    .replace(/-+/g, "-") // replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // trim hyphens from ends

export default function CategoryManagementClient({
  initialCategories,
}: CategoryManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form states
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    image: "",
    text: "",
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  
  // Notification states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Auto-generate slug on name change (unless slug is manually edited)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormState((prev) => ({
      ...prev,
      name: val,
      slug: isSlugManuallyEdited ? prev.slug : slugify(val),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIsSlugManuallyEdited(true);
    setFormState((prev) => ({
      ...prev,
      slug: slugify(val), // ensure formatted
    }));
  };

  // Open Form Modal for Create
  const handleOpenCreate = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setFormState({ name: "", slug: "", image: "", text: "" });
    setIsSlugManuallyEdited(false);
    setModalMode("create");
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEdit = (category: Category) => {
    setErrorMsg("");
    setSuccessMsg("");
    setFormState({
      name: category.name,
      slug: category.slug,
      image: category.image,
      text: category.text,
    });
    setIsSlugManuallyEdited(true);
    setModalMode("edit");
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (category: Category) => {
    setErrorMsg("");
    setSuccessMsg("");
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  // Submit Form (Create or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formState.name.trim()) {
      setErrorMsg("Category name is required.");
      return;
    }
    if (!formState.slug.trim()) {
      setErrorMsg("Category slug is required.");
      return;
    }
    if (!formState.image) {
      setErrorMsg("Category image is required.");
      return;
    }

    startTransition(async () => {
      let res;
      if (modalMode === "create") {
        res = await createCategory(formState);
      } else {
        if (!selectedCategory) return;
        res = await updateCategory(selectedCategory.id, formState);
      }

      if (res.success) {
        setSuccessMsg(
          `Category "${formState.name}" was successfully ${
            modalMode === "create" ? "created" : "updated"
          }.`
        );
        setIsFormOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to save category.");
      }
    });
  };

  // Execute Delete
  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setErrorMsg("");

    startTransition(async () => {
      const res = await deleteCategory(selectedCategory.id);
      if (res.success) {
        setSuccessMsg(`Category "${selectedCategory.name}" was successfully deleted.`);
        setIsDeleteOpen(false);
        setSelectedCategory(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to delete category.");
      }
    });
  };

  // Filter categories client-side based on search query
  const filteredCategories = initialCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800 font-sans">Categories</h2>
            <p className="text-xs text-slate-500">{initialCategories.length} total categories seeded</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm shadow-blue-100 font-sans cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-sans flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar Filter */}
      <div className="mb-6 relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search categories by name, slug or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      {/* Grid view empty state */}
      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 font-sans">No Categories Found</h3>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            No matching categories were found for &quot;{searchQuery}&quot;. Try editing your query.
          </p>
        </div>
      )}

      {/* Desktop view (Table layout) */}
      {filteredCategories.length > 0 && (
        <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider font-sans">
                <th className="px-6 py-4 w-24">Image</th>
                <th className="px-6 py-4 w-52">Name & Slug</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-sans">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-150 bg-slate-50 shadow-sm shrink-0">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          className="object-cover"
                          sizes="60px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 text-sm">{cat.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{cat.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 text-xs line-clamp-2 max-w-lg leading-relaxed">
                      {cat.text || <span className="text-slate-350 italic">No description provided</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="h-10 w-10 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Edit Category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(cat)}
                        className="h-10 w-10 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Delete Category"
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

      {/* Mobile view (Card stack layout) */}
      {filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:hidden mb-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-150 bg-slate-50 shadow-sm shrink-0">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{cat.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{cat.slug}</div>
                </div>
              </div>

              {cat.text && (
                <p className="text-slate-650 text-xs leading-relaxed line-clamp-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-50">
                  {cat.text}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-3 mt-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="h-12 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl flex items-center gap-2 text-xs font-semibold font-sans cursor-pointer focus:outline-none"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenDelete(cat)}
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

      {/* ADD/EDIT CATEGORY MODAL DIALOG OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 font-sans">
                {modalMode === "create" ? "Add New Category" : "Edit Category"}
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
            <form onSubmit={handleFormSubmit} className="p-5 flex-1 flex flex-col gap-4">
              {errorMsg && (
                <div className="p-3 bg-red-55 text-red-800 border border-red-100 text-xs rounded-xl font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Category Image Upload component */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-sans">
                  Category Image / Thumbnail <span className="text-red-500">*</span>
                </label>
                <ImageUpload
                  value={formState.image}
                  onChange={(url) => setFormState((prev) => ({ ...prev, image: url }))}
                  onRemove={() => setFormState((prev) => ({ ...prev, image: "" }))}
                />
              </div>

              {/* Category Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="category-name" className="text-xs font-bold text-slate-700 font-sans">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="category-name"
                  type="text"
                  placeholder="e.g. Brain Puzzles"
                  value={formState.name}
                  onChange={handleNameChange}
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Category Slug Input */}
              <div className="space-y-1.5">
                <label htmlFor="category-slug" className="text-xs font-bold text-slate-700 font-sans">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="category-slug"
                  type="text"
                  placeholder="e.g. brain-puzzles"
                  value={formState.slug}
                  onChange={handleSlugChange}
                  className="w-full h-12 px-4 border border-slate-200 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Category Description text area */}
              <div className="space-y-1.5">
                <label htmlFor="category-text" className="text-xs font-bold text-slate-700 font-sans">
                  Description Text (Optional)
                </label>
                <textarea
                  id="category-text"
                  placeholder="Describe the learning goals, motor skills, or resources included in this category..."
                  value={formState.text}
                  onChange={(e) => setFormState((prev) => ({ ...prev, text: e.target.value }))}
                  rows={4}
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
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
                    <span>Save Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {isDeleteOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 font-sans">Delete Category?</h3>
                <p className="text-sm text-slate-500 mt-1 font-sans">
                  Are you sure you want to delete <span className="font-semibold text-slate-700">&quot;{selectedCategory.name}&quot;</span>?
                  This action cannot be undone.
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
