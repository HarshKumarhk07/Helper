import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listProducts, createProduct, deleteProduct, updateProduct } from '../../api/products.js';
import { listProductCategories } from '../../api/productCategories.js';
import api from '../../api/axios.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { Trash2, AlertTriangle, Edit2, Star, ArrowLeft } from 'lucide-react';
import { resolveCatalogImage, mediaUrl } from '../../lib/catalogImage.js';
import { Link } from 'react-router-dom';

export default function BrandProducts() {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, productId: null, productName: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');
  const lowStockThreshold = 5;

  const [newProduct, setNewProduct] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category: '', image: '', isFeatured: false
  });

  const [editForm, setEditForm] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category: '', image: '', isFeatured: false
  });

  const load = () => {
    setLoading(true);
    // Fetch only the logged in brand's products
    Promise.all([
      listProducts({ brand: 'my' }),
    ])
      .then(([resProducts]) => {
        const prodList = resProducts.products || resProducts;
        setProducts(prodList);
        setLowStockProducts(prodList.filter(p => p.stock <= lowStockThreshold));
      })
      .catch(() => toast.error('Failed to load catalog products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    listProductCategories()
      .then(setCategories)
      .catch(() => toast.error('Failed to load product categories'));
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (editingProduct) {
        setEditForm({ ...editForm, image: res.data.url });
      } else {
        setNewProduct({ ...newProduct, image: res.data.url });
      }
      toast.success('Image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err?.response || err?.message || err);
      const message = err?.response?.data?.error || err?.response?.data?.details || err?.message || 'Image upload failed';
      toast.error(String(message));
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProduct({ ...newProduct, price: Number(newProduct.price), stock: Number(newProduct.stock) });
      toast.success('Product created successfully');
      setShowForm(false);
      setNewProduct({ name: '', slug: '', description: '', price: '', stock: '', category: '', image: '', isFeatured: false });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create product');
    }
  };

  const handleDelete = async (id, productName) => {
    setDeleteModal({ show: true, productId: id, productName });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteModal.productId);
      toast.success('Product deleted');
      setDeleteModal({ show: false, productId: null, productName: '' });
      load();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      image: product.image,
      isFeatured: product.isFeatured || false,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(editingProduct._id, {
        ...editForm,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
      });
      toast.success('Product updated successfully');
      setEditingProduct(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update product');
    }
  };

  const activeProducts = stockFilter === 'low' ? lowStockProducts : products;

  return (
    <div className="bg-paper min-h-screen pt-12 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6">
          <Link to="/brand" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/75 hover:text-ink transition-colors uppercase tracking-wider">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <DashboardShell
          eyebrow="Catalogue"
          title="Seller Catalogue"
          slices={[
            { tag: 'Catalog', title: `${products.length} Products`, body: 'Total listings uploaded inside your storefront' },
            { tag: 'Inventory', title: `${lowStockProducts.length} Items`, body: 'Products that have critical inventory level <= 5' }
          ]}
        >
          {/* Filters and Add button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 pb-6 border-b border-ink/5">
            <div className="flex gap-2">
              <button
                onClick={() => setStockFilter('all')}
                className={`py-1.5 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  stockFilter === 'all' ? 'bg-ink text-paper' : 'bg-ink/5 text-ink/80 hover:bg-ink/10'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`py-1.5 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  stockFilter === 'low' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/25'
                }`}
              >
                <AlertTriangle size={12} /> Low Stock
              </button>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(!showForm);
              }}
              className="bg-[#13294B] text-white rounded-full py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-[#13294B]/90 transition-all text-center"
            >
              {showForm ? 'Close Editor' : 'Add New Product'}
            </button>
          </div>

          {/* Add / Edit Form */}
          {(showForm || editingProduct) && (
            <FadeUp>
              <form onSubmit={editingProduct ? handleUpdate : handleCreate} className="mt-8 p-6 bg-white border border-ink/5 rounded-3xl shadow-sm max-w-2xl">
                <h3 className="font-semibold text-sm text-ink mb-6">{editingProduct ? 'Edit Listing Details' : 'Add New Product to Store'}</h3>
                
                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65 mb-1.5">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Copper Wire spool"
                      value={editingProduct ? editForm.name : newProduct.name}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        if (editingProduct) {
                          setEditForm({ ...editForm, name: e.target.value, slug });
                        } else {
                          setNewProduct({ ...newProduct, name: e.target.value, slug });
                        }
                      }}
                      className="w-full bg-sand/30 border border-ink/10 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-[#13294B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65 mb-1.5">SEO Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="copper-wire-spool"
                      value={editingProduct ? editForm.slug : newProduct.slug}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditForm({ ...editForm, slug: e.target.value });
                        } else {
                          setNewProduct({ ...newProduct, slug: e.target.value });
                        }
                      }}
                      className="w-full bg-sand/30 border border-ink/10 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-[#13294B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65 mb-1.5">Price (INR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="120"
                      value={editingProduct ? editForm.price : newProduct.price}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditForm({ ...editForm, price: e.target.value });
                        } else {
                          setNewProduct({ ...newProduct, price: e.target.value });
                        }
                      }}
                      className="w-full bg-sand/30 border border-ink/10 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-[#13294B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65 mb-1.5">Initial Stock Level</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="50"
                      value={editingProduct ? editForm.stock : newProduct.stock}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditForm({ ...editForm, stock: e.target.value });
                        } else {
                          setNewProduct({ ...newProduct, stock: e.target.value });
                        }
                      }}
                      className="w-full bg-sand/30 border border-ink/10 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-[#13294B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65 mb-1.5">Category</label>
                    <select
                      required
                      value={editingProduct ? editForm.category : newProduct.category}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditForm({ ...editForm, category: e.target.value });
                        } else {
                          setNewProduct({ ...newProduct, category: e.target.value });
                        }
                      }}
                      className="w-full bg-sand/30 border border-ink/10 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-[#13294B]"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65 mb-1.5">Product Image</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="brand-product-image-upload"
                      />
                      <label
                        htmlFor="brand-product-image-upload"
                        className="cursor-pointer bg-sand/30 hover:bg-sand/65 border border-ink/10 rounded-xl py-2 px-4 text-xs font-semibold text-ink text-center flex-1"
                      >
                        {uploading ? 'Uploading...' : 'Choose File'}
                      </label>
                      {(editingProduct ? editForm.image : newProduct.image) && (
                        <img
                          src={mediaUrl(editingProduct ? editForm.image : newProduct.image)}
                          alt="preview"
                          className="h-10 w-10 object-cover rounded-lg border"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#13294B] mb-1.5">Detailed Description</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Provide details about size, material specifications, and quality..."
                    value={editingProduct ? editForm.description : newProduct.description}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditForm({ ...editForm, description: e.target.value });
                      } else {
                        setNewProduct({ ...newProduct, description: e.target.value });
                      }
                    }}
                    className="w-full bg-sand/30 border border-ink/10 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-[#13294B]"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                    }}
                    className="border border-ink/10 text-ink/80 rounded-full py-2 px-5 text-xs font-semibold hover:bg-ink/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#13294B] text-white rounded-full py-2 px-6 text-xs font-bold uppercase tracking-wider hover:bg-[#13294B]/90"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Listing'}
                  </button>
                </div>
              </form>
            </FadeUp>
          )}

          {/* Product Cards */}
          {loading ? (
            <div className="py-20 text-center text-xs text-ink/50">Loading catalogue data...</div>
          ) : activeProducts.length === 0 ? (
            <div className="py-20 text-center text-xs text-ink/50 border border-dashed border-ink/15 rounded-3xl mt-8">
              No products match this filter. Start listing by clicking 'Add New Product' above.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 mt-8">
              {activeProducts.map((p) => (
                <FadeUp key={p._id}>
                  <div className="group relative card-rounded p-4 bg-white border border-ink/5 hover:shadow-lg transition-all flex flex-col justify-between h-full">
                    <div>
                      <div className="aspect-video w-full overflow-hidden rounded-xl border border-ink/5 bg-sand/10 relative mb-4">
                        <img
                          src={mediaUrl(p.image) || resolveCatalogImage(p.name)}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {p.stock <= lowStockThreshold && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                            <AlertTriangle size={8} /> Low Stock ({p.stock})
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-semibold text-ink text-sm line-clamp-1">{p.name}</h4>
                        {p.isFeatured && <Star size={14} className="fill-amber-400 text-amber-400 mt-0.5 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-ink/50 mt-1 uppercase tracking-wider">{p.category}</p>
                      <p className="text-xs text-ink/75 leading-relaxed line-clamp-2 mt-2">{p.description}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-ink/5 flex items-center justify-between">
                      <div className="text-sm font-bold text-ink">₹{p.price}</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 text-ink/70 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Decommission Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          )}
        </DashboardShell>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-ink/5 max-w-sm w-full p-6 rounded-3xl shadow-xl text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={22} />
            </div>
            <h4 className="font-bold text-ink text-base">Decommission Listing?</h4>
            <p className="text-xs text-ink/70 mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-ink">{deleteModal.productName}</span>? This will make the product inactive inside the public store.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteModal({ show: false, productId: null, productName: '' })}
                className="flex-1 border border-ink/10 text-ink/80 rounded-full py-2.5 text-xs font-semibold hover:bg-ink/5 transition-all"
              >
                No, Keep
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
