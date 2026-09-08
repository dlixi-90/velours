import { useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import CategoryTypes from "../../components/owner/CategoryTypes";
import DeleteCategoryDialog from "../../components/owner/DeleteCategoryDialog";

const AddCategory = () => {
  const {
    axios, getToken, categories, categoriesLoading, categoriesError,
    fetchCategories, replaceCategory, removeCategory, fetchProducts,
  } = useAppContext();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const busy = saving || savingType || deleting;
  const query = search.trim().toLowerCase();
  const visibleCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(query) ||
    (category.types || []).some((type) => type.name.toLowerCase().includes(query)),
  );

  const requestDelete = (category, type = null) => {
    setDeleteError("");
    setDeleteTarget({ category, type });
  };

  const confirmDelete = async () => {
    if (busy || !deleteTarget) return;
    const { category, type } = deleteTarget;
    setDeleting(true);
    setDeleteError("");
    try {
      const url = `/api/categories/${category._id}${type ? `/types/${type._id}` : ""}`;
      const { data } = await axios.delete(url, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message || "Unable to delete");
      if (type) {
        replaceCategory(data.category);
      } else {
        removeCategory(category._id);
        if (expandedId === category._id) setExpandedId(null);
        if (editingId === category._id) setEditingId(null);
      }
      setDeleteTarget(null);
      toast.success(data.message);
    } catch (error) {
      setDeleteError(error.response?.data?.message || error.message || "Unable to delete");
    } finally {
      setDeleting(false);
    }
  };

  const saveType = async (category, value, typeId) => {
    if (busy) return false;
    const nextName = value.trim().replace(/\s+/g, " ");
    if (!nextName || nextName.length > 100) {
      toast.error("Type name must contain 1 to 100 characters");
      return false;
    }
    if ((category.types || []).some((type) => type._id !== typeId &&
      type.name.toLowerCase() === nextName.toLowerCase())) {
      toast.error("Type name already exists in this category");
      return false;
    }
    setSavingType(true);
    try {
      const config = { headers: { Authorization: `Bearer ${await getToken()}` } };
      const url = `/api/categories/${category._id}/types`;
      const { data } = typeId
        ? await axios.put(`${url}/${typeId}`, { name: nextName }, config)
        : await axios.post(url, { name: nextName }, config);
      if (!data.success) throw new Error(data.message || "Unable to save type");
      replaceCategory(data.category);
      if (typeId) await fetchProducts();
      toast.success(data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to save type");
      return false;
    } finally {
      setSavingType(false);
    }
  };

  const saveCategory = async (event, categoryId = null) => {
    event.preventDefault();
    if (busy) return;
    const nextName = (categoryId ? editName : name).trim().replace(/\s+/g, " ");
    if (!nextName || nextName.length > 100) {
      toast.error("Category name must contain 1 to 100 characters");
      return;
    }
    if (categories.some((item) => item._id !== categoryId &&
      item.name.toLowerCase() === nextName.toLowerCase())) {
      toast.error("Category name already exists");
      return;
    }

    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${await getToken()}` } };
      const { data } = categoryId
        ? await axios.put(`/api/categories/${categoryId}`, { name: nextName }, config)
        : await axios.post("/api/categories", { name: nextName }, config);
      if (!data.success) throw new Error(data.message || "Unable to save category");
      replaceCategory(data.category);
      if (categoryId) {
        setEditingId(null);
        setEditName("");
        await fetchProducts();
      } else {
        setName("");
        setSearch("");
        setExpandedId(data.category._id);
      }
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="m-1 h-[97vh] overflow-y-auto rounded-xl bg-primary px-3 py-6 shadow sm:m-3 sm:px-5 md:px-8 lg:w-11/12 xl:py-8">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#e1e6e3] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#6f9a79]">Products</p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#263b4a] sm:text-3xl">Add Category</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71808a]">Create and rename categories and manage their product types.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8e5da] bg-[#edf6ee] px-3 py-1.5 text-xs font-medium text-[#557b5e]">
            <Tags size={15} /> Product categories
          </div>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e2e7e4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#263b4a]">Category details</h2>
            <p className="mt-1 text-sm text-[#839099]">Add a category for your products.</p>
            <form onSubmit={saveCategory} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1">
                <span className="mb-2 block text-sm font-medium text-[#334957]">Category name <span className="text-[#b55f5f]">*</span></span>
                <input type="text" value={name} onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Hair Care" className="admin-input" maxLength={100}
                  autoComplete="off" required disabled={busy} />
              </label>
              <button type="submit" disabled={busy || categoriesLoading || Boolean(categoriesError)} className="admin-primary-button shrink-0 justify-center">
                <Plus size={17} /> {saving && !editingId ? "Adding category..." : "Add category"}
              </button>
            </form>
          </section>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2e7e4] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
              <div>
                <h2 className="text-lg font-semibold text-[#263b4a]">Existing categories</h2>
                <p className="mt-1 text-sm text-[#839099]">Select a category to manage its types.</p>
              </div>
              <span className="rounded-full bg-[#edf6ee] px-3 py-1 text-xs font-medium text-[#557b5e]">{categories.length}</span>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <label className="relative block">
                <Search size={17} className="pointer-events-none absolute left-3 top-3 text-[#839099]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories or types..." aria-label="Search categories or types"
                  className="admin-input !pl-10 !pr-10" type="search" />
              </label>
              {query && <p className="mt-2 text-xs text-[#839099]" role="status">{visibleCategories.length} of {categories.length} categories</p>}
            </div>
            <div aria-busy={categoriesLoading}>
              {categoriesLoading ? (
                <p className="py-8 text-center text-sm text-[#839099]">Loading categories...</p>
              ) : categoriesError ? (
                <div role="alert" className="rounded-lg border border-[#efd4d4] p-4 text-sm text-[#b55f5f]">
                  <p>{categoriesError}</p>
                  <button type="button" onClick={fetchCategories} className="mt-2 font-medium underline">Try again</button>
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d5ddd7] px-4 py-8 text-center">
                  <Tags size={24} className="mx-auto text-[#8ca095]" />
                  <p className="mt-2 text-sm font-medium text-[#76847c]">No categories added</p>
                  <p className="mt-1 text-xs text-[#9aa49e]">Add your first category using the form.</p>
                </div>
              ) : visibleCategories.length === 0 ? (
                <div className="border-t border-[#e2e7e4] px-5 py-10 text-center">
                  <Search size={24} className="mx-auto text-[#8ca095]" />
                  <p className="mt-3 text-sm text-[#71808a]">No matching categories or types.</p>
                  <button type="button" onClick={() => setSearch("")} className="mt-2 text-sm font-medium text-[#557b5e] underline">Clear search</button>
                </div>
              ) : (
                <ul className="divide-y divide-[#e2e7e4] border-t border-[#e2e7e4]">
                  {visibleCategories.map((category) => {
                    const expanded = expandedId === category._id;
                    const types = category.types || [];
                    return (
                      <li key={category._id}>
                        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 sm:flex-nowrap sm:px-6 ${expanded ? "bg-[#f2f7f3]" : "hover:bg-[#fafcfa]"}`}>
                          <button type="button" disabled={busy} aria-expanded={expanded}
                            aria-controls={`category-types-${category._id}`}
                            onClick={() => setExpandedId(expanded ? null : category._id)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a79] disabled:opacity-60">
                            <ChevronDown size={18} className={`shrink-0 text-[#6f9a79] transition-transform ${expanded ? "" : "-rotate-90"}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block break-words text-sm font-semibold text-[#263b4a]">{category.name}</span>
                              <span className="mt-1 block truncate text-xs text-[#839099]">
                                {types.length ? types.slice(0, 3).map((type) => type.name).join(" · ") + (types.length > 3 ? " …" : "") : "No types yet"}
                              </span>
                            </span>
                            <span className="shrink-0 rounded-full bg-[#edf6ee] px-2.5 py-1 text-xs font-medium text-[#557b5e]">{types.length} {types.length === 1 ? "type" : "types"}</span>
                          </button>
                          <div className="ml-auto flex shrink-0 items-center gap-1">
                            <button type="button" disabled={busy}
                              onClick={() => { setExpandedId(category._id); setEditingId(category._id); setEditName(category.name); }}
                              aria-label={`Edit ${category.name}`} title="Edit category"
                              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[#496852] hover:bg-[#e5efe7] disabled:opacity-60">
                              <Pencil size={15} /><span className="hidden sm:inline">Edit</span>
                            </button>
                            <button type="button" disabled={busy} onClick={() => requestDelete(category)}
                              aria-label={`Delete category ${category.name}`} title="Delete category"
                              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">
                              <Trash2 size={15} /><span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </div>
                        <div id={`category-types-${category._id}`} hidden={!expanded} className="border-t border-[#e2e7e4] bg-[#f8faf8] px-5 py-5 sm:px-6 sm:pl-14">
                          {editingId === category._id && (
                            <form onSubmit={(event) => saveCategory(event, category._id)} className="mb-5 space-y-3 rounded-xl border border-[#e2e7e4] bg-white p-4">
                              <label className="block">
                                <span className="mb-2 block text-sm font-medium text-[#334957]">Category name</span>
                                <input type="text" value={editName} onChange={(event) => setEditName(event.target.value)}
                                  className="admin-input" maxLength={100} required autoFocus disabled={busy} />
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <button type="submit" disabled={busy} className="admin-primary-button"><Check size={16} /> {saving ? "Saving..." : "Save changes"}</button>
                                <button type="button" disabled={busy} onClick={() => { setEditingId(null); setEditName(""); }}
                                  className="inline-flex items-center gap-2 rounded-lg border border-[#dfe5e8] px-4 py-2.5 text-sm font-medium text-[#52616a] transition hover:bg-white disabled:opacity-60"><X size={16} /> Cancel</button>
                              </div>
                            </form>
                          )}
                          <CategoryTypes category={category} disabled={busy} onSave={saveType} onDelete={requestDelete} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
      {deleteTarget && (
        <DeleteCategoryDialog target={deleteTarget} busy={deleting} error={deleteError}
          onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}
    </main>
  );
};

export default AddCategory;
