import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listProducts, createProduct, deleteProduct, updateProduct } from '../../api/products.js';
import api from '../../api/axios.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { Trash2, AlertTriangle, Edit2, Star } from 'lucide-react';
import { resolveCatalogImage } from '../../lib/catalogImage.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, productId: null, productName: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');
  const lowStockThreshold = 5;
  
  const [newProduct, setNewProduct] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category: 'all', image: '', isFeatured: false
  });

  const [editForm, setEditForm] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category: 'all', image: '', isFeatured: false
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      listProducts(),
      listProducts({ lowStock: 'true', stockThreshold: lowStockThreshold }),
    ])
      .then(([allProducts, lowStock]) => {
        setProducts(allProducts);
        setLowStockProducts(lowStock);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      setNewProduct({ ...newProduct, image: res.data.url });
      toast.success('Image uploaded to Cloudinary!');
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
      toast.success('Product created');
      setShowForm(false);
      setNewProduct({ name: '', slug: '', description: '', price: '', stock: '', category: 'all', image: '', isFeatured: false });
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

  const openEditor = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category || 'all',
      image: product.image || '',
      isFeatured: Boolean(product.isFeatured),
    });
  };

  const closeEditor = () => {
    setEditingProduct(null);
    setEditForm({ name: '', slug: '', description: '', price: '', stock: '', category: 'all', image: '', isFeatured: false });
  };

  const getFilteredProducts = () => {
    if (stockFilter === 'all') return products;
    if (stockFilter === 'outOfStock') return products.filter(p => p.stock <= 0);
    if (stockFilter === 'lowStock') return products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);
    if (stockFilter === 'inStock') return products.filter(p => p.stock > lowStockThreshold);
    return products;
  };

  const filteredProducts = getFilteredProducts();

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
      };
      const updated = await updateProduct(editingProduct._id, payload);
      setProducts((current) => current.map((p) => (p._id === updated._id ? updated : p)));
      toast.success('Product updated successfully');
      closeEditor();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update product');
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      const updated = await updateProduct(product._id, { isFeatured: !product.isFeatured });
      setProducts((current) => current.map((p) => (p._id === updated._id ? updated : p)));
      setLowStockProducts((current) => current.map((p) => (p._id === updated._id ? updated : p)));
      toast.success(updated.isFeatured ? 'Marked as featured' : 'Removed from featured');
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  return (
    <DashboardShell eyebrow="(E-Commerce)" title="MANAGE CATALOG.">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">Products List</h2>
        <button onClick={() => setShowForm(!showForm)} className="pill-btn-solid text-sm">
          {showForm ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Products' },
          { key: 'inStock', label: 'In Stock' },
          { key: 'lowStock', label: 'Low Stock' },
          { key: 'outOfStock', label: 'Out of Stock' },
        ].map((tab) => {
          const active = stockFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStockFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
                active
                  ? 'bg-ink text-paper'
                  : 'border border-ink/15 hover:border-ink/40:border-paper/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {lowStockProducts.length > 0 && (
        <div className="mb-6 rounded-card border border-red-900 bg-red-900/5 p-4 text-sm text-red-900">
          <div className="font-bold uppercase tracking-widest text-xs mb-1">
            Low Stock Alert
          </div>
          {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} at or below {lowStockThreshold} units.
        </div>
      )}

      {showForm && (
        <FadeUp>
          <form onSubmit={handleCreate} className="card-rounded p-6 mb-8 bg-sand/30">
            <h3 className="text-xl font-bold mb-4">NEW PRODUCT</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Product Name</label>
                <input required placeholder="e.g., Tool Kit" className="w-full p-3 border rounded-xl bg-white" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Slug (URL-friendly)</label>
                <input required placeholder="e.g., tool-kit" className="w-full p-3 border rounded-xl bg-white" value={newProduct.slug} onChange={(e) => setNewProduct({...newProduct, slug: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Price (₹)</label>
                <input required type="number" placeholder="1499" className="w-full p-3 border rounded-xl bg-white" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Stock Quantity</label>
                <input required type="number" placeholder="100" className="w-full p-3 border rounded-xl bg-white" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Category</label>
                <input required placeholder="e.g., Electronics" className="w-full p-3 border rounded-xl bg-white" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Description</label>
              <textarea required placeholder="Describe the product features and benefits..." className="w-full p-3 border rounded-xl bg-white h-24" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
            </div>
            
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Product Image</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="p-2 border rounded-xl flex-1 bg-white" />
                {uploading && <span className="text-sm">Uploading...</span>}
                {newProduct.image && <img src={newProduct.image} alt="Preview" className="h-16 w-16 object-cover rounded-xl" />}
              </div>
            </div>

            <label className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink/70">
              <input
                type="checkbox"
                checked={newProduct.isFeatured}
                onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })}
              />
              Mark as featured product
            </label>

            <button type="submit" className="pill-btn-solid" disabled={uploading}>Save Product</button>
          </form>
        </FadeUp>
      )}

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Featured</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center">No products found.</td></tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p._id}>
                  <td className="p-4">
                    <img src={resolveCatalogImage(p)} className="w-12 h-12 rounded object-cover" alt={p.name} />
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">₹{p.price}</td>
                  <td className="p-4">
                    {p.stock <= 0 ? (
                      <span className="rounded-pill bg-red-900 px-3 py-1 text-xs font-bold text-white">Out of stock</span>
                    ) : p.stock <= lowStockThreshold ? (
                      <span className="rounded-pill bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{p.stock}</span>
                    ) : (
                      <span>{p.stock}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      title={p.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest transition ${
                        p.isFeatured
                          ? 'bg-amber-400 text-white hover:bg-amber-500'
                          : 'border border-ink/20 text-ink/50 hover:border-ink/60'
                      }`}
                    >
                      {p.isFeatured ? '★ Featured' : 'Feature'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditor(p)} className="text-blue-500 hover:text-blue-700 transition" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(p._id, p.name)} className="text-red-500 hover:text-red-700 transition" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm overflow-y-auto">
          <div className="card-rounded w-full max-w-2xl border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] my-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60">Edit Product</div>
                <h3 className="heading-display mt-2 text-2xl">{editingProduct.name}</h3>
              </div>
              <button onClick={closeEditor} className="pill-btn text-xs">Close</button>
            </div>

            <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Product Name</label>
                <input required placeholder="Product name" className="w-full p-3 border rounded-xl bg-white text-ink border-ink/20" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Slug</label>
                <input required placeholder="URL-friendly slug" className="w-full p-3 border rounded-xl bg-white text-ink border-ink/20" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Price (₹)</label>
                <input required type="number" placeholder="1499" className="w-full p-3 border rounded-xl bg-white text-ink border-ink/20" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Stock Quantity</label>
                <input required type="number" placeholder="100" className="w-full p-3 border rounded-xl bg-white text-ink border-ink/20" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Category</label>
                <input required placeholder="e.g., Electronics" className="w-full p-3 border rounded-xl bg-white text-ink border-ink/20" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Description</label>
                <textarea required placeholder="Product description..." className="w-full p-3 border rounded-xl bg-white text-ink border-ink/20 h-24" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Image URL or Upload</label>
                <input placeholder="Image URL" className="w-full p-3 border rounded-xl bg-white text-ink border-ink/20 mb-2" value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} />
                <div className="border-t border-ink/10 pt-3">
                  <div className="text-xs text-ink/60 mb-2">Or upload new image:</div>
                  <input type="file" accept="image/*" className="w-full text-sm" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const formData = new FormData();
                      formData.append('image', file);
                      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setEditForm({ ...editForm, image: res.data.url });
                      toast.success('Image uploaded');
                    } catch {
                      toast.error('Upload failed');
                    }
                  }} />
                </div>
                {editForm.image && <img src={editForm.image} alt="Preview" className="h-16 w-16 object-cover rounded-xl mt-3" />}
              </div>

              <label className="md:col-span-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink/70">
                <input
                  type="checkbox"
                  checked={editForm.isFeatured}
                  onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                />
                Featured product
              </label>

              <div className="md:col-span-2 flex gap-3 pt-4">
                <button type="button" onClick={closeEditor} className="flex-1 px-4 py-3 rounded-xl border border-ink/20 hover:bg-ink/5:bg-paper/5 transition font-medium uppercase tracking-widest text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-ink text-paper rounded-xl font-medium uppercase tracking-widest text-sm hover:opacity-90 transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-sm border border-paper/10 bg-paper p-8 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-100">
                <AlertTriangle className="text-red-600" size={28} />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-center mb-2">Delete Product</h3>
            <p className="text-center text-ink/70 mb-6">
              Are you sure you want to delete <strong className="text-red-600">{deleteModal.productName}</strong>? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, productId: null, productName: '' })}
                className="flex-1 px-4 py-3 rounded-xl border border-ink/20 hover:bg-ink/5:bg-paper/5 transition font-medium uppercase tracking-widest text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium uppercase tracking-widest text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
