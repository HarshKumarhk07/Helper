import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listProducts, createProduct, deleteProduct } from '../../api/products.js';
import api from '../../api/axios.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { Trash2 } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lowStockThreshold = 5;
  
  const [newProduct, setNewProduct] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category: 'all', image: ''
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
      toast.error('Image upload failed');
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
      setNewProduct({ name: '', slug: '', description: '', price: '', stock: '', category: 'all', image: '' });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete product');
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

      {lowStockProducts.length > 0 && (
        <div className="mb-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
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
              <input required placeholder="Product Name" className="p-3 border rounded-xl" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} />
              <input required placeholder="Slug" className="p-3 border rounded-xl" value={newProduct.slug} onChange={(e) => setNewProduct({...newProduct, slug: e.target.value})} />
              <input required type="number" placeholder="Price (₹)" className="p-3 border rounded-xl" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
              <input required type="number" placeholder="Stock" className="p-3 border rounded-xl" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
              <input required placeholder="Category" className="p-3 border rounded-xl" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
            </div>
            
            <textarea required placeholder="Description" className="w-full p-3 border rounded-xl mb-4 h-24" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
            
            <div className="mb-6">
              <label className="block text-sm mb-2 font-medium">Product Image (Cloudinary)</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="p-2 border rounded-xl flex-1 bg-white" />
                {uploading && <span className="text-sm">Uploading...</span>}
                {newProduct.image && <img src={newProduct.image} alt="Preview" className="h-16 w-16 object-cover rounded-xl" />}
              </div>
            </div>

            <button type="submit" className="pill-btn-solid" disabled={uploading}>Save Product</button>
          </form>
        </FadeUp>
      )}

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {loading ? (
              <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center">No products found.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p._id}>
                  <td className="p-4">
                    {p.image ? <img src={p.image} className="w-12 h-12 rounded object-cover" alt="" /> : <div className="w-12 h-12 bg-sand rounded"></div>}
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">₹{p.price}</td>
                  <td className="p-4">
                    <span className={p.stock <= lowStockThreshold ? 'rounded-pill bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900' : ''}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(p._id)} className="text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
