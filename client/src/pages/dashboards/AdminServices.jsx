import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listServices, createService, deleteService, updateService } from '../../api/services.js';
import { listCategories } from '../../api/categories.js';
import api from '../../api/axios.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { Trash2, AlertTriangle, Edit2 } from 'lucide-react';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, serviceId: null, serviceName: '' });
  const [editingService, setEditingService] = useState(null);
  
  const [newService, setNewService] = useState({
    name: '', slug: '', description: '', price: '', category: '', image: '', durationMinutes: ''
  });

  const [editForm, setEditForm] = useState({
    name: '', slug: '', description: '', price: '', category: '', image: '', durationMinutes: ''
  });

  const load = () => {
    setLoading(true);
    listServices()
      .then(setServices)
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    listCategories({ active: 'true' })
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'));
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
      setNewService({ ...newService, image: res.data.url });
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
      await createService({
        ...newService,
        price: Number(newService.price),
        category: newService.category,
        durationMinutes: newService.durationMinutes ? Number(newService.durationMinutes) : 60
      });
      toast.success('Service created');
      setShowForm(false);
      setNewService({ name: '', slug: '', description: '', price: '', category: '', image: '', durationMinutes: '' });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create service');
    }
  };

  const handleDelete = async (id, serviceName) => {
    setDeleteModal({ show: true, serviceId: id, serviceName });
  };

  const confirmDelete = async () => {
    try {
      await deleteService(deleteModal.serviceId);
      toast.success('Service deleted');
      setDeleteModal({ show: false, serviceId: null, serviceName: '' });
      load();
    } catch (err) {
      toast.error('Failed to delete service');
    }
  };

  const openEditor = (service) => {
    setEditingService(service);
    setEditForm({
      name: service.name || '',
      slug: service.slug || '',
      description: service.description || '',
      price: service.price || '',
      category: service.category?._id || service.category || '',
      image: service.image || '',
      durationMinutes: service.durationMinutes || '',
    });
  };

  const closeEditor = () => {
    setEditingService(null);
    setEditForm({ name: '', slug: '', description: '', price: '', category: '', image: '', durationMinutes: '' });
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price),
        category: editForm.category,
        durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) : 60
      };
      const updated = await updateService(editingService._id, payload);
      setServices((current) => current.map((s) => (s._id === updated._id ? updated : s)));
      toast.success('Service updated successfully');
      closeEditor();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update service');
    }
  };

  return (
    <DashboardShell eyebrow="(Services)" title="SERVICE CATALOG.">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">Services List</h2>
        <button onClick={() => setShowForm(!showForm)} className="pill-btn-solid text-sm">
          {showForm ? 'Cancel' : 'Add New Service'}
        </button>
      </div>

      {showForm && (
        <FadeUp>
          <form onSubmit={handleCreate} className="card-rounded p-6 mb-8 bg-sand/30">
            <h3 className="text-xl font-bold mb-4">NEW SERVICE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Service Name</label>
                <input required placeholder="e.g., TV Installation" className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Slug (URL-friendly)</label>
                <input required placeholder="e.g., tv-installation" className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10" value={newService.slug} onChange={(e) => setNewService({...newService, slug: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Price (₹)</label>
                <input required type="number" placeholder="499" className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Duration (minutes)</label>
                <input required type="number" placeholder="e.g., 120" min="5" max="600" className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10" value={newService.durationMinutes} onChange={(e) => setNewService({...newService, durationMinutes: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Category</label>
                <select
                  required
                  className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10"
                  value={newService.category}
                  onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Description</label>
              <textarea required placeholder="Describe what's included in this service..." className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10 h-24" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} />
            </div>
            
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Service Image (Cloudinary)</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="p-2 border rounded-xl flex-1 bg-white dark:bg-paper/10" />
                {uploading && <span className="text-sm">Uploading...</span>}
                {newService.image && <img src={newService.image} alt="Preview" className="h-16 w-16 object-cover rounded-xl" />}
              </div>
            </div>

            <button type="submit" className="pill-btn-solid" disabled={uploading}>Save Service</button>
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
              <th className="p-4">Duration</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {loading ? (
              <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
            ) : services.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center">No services found.</td></tr>
            ) : (
              services.map(s => (
                <tr key={s._id}>
                  <td className="p-4">
                    {s.image ? <img src={s.image} className="w-12 h-12 rounded object-cover" alt="" /> : <div className="w-12 h-12 bg-sand rounded"></div>}
                  </td>
                  <td className="p-4 font-medium">{s.name}</td>
                  <td className="p-4">₹{s.price}</td>
                  <td className="p-4">{s.duration}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditor(s)} className="text-blue-500 hover:text-blue-700 transition" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(s._id, s.name)} className="text-red-500 hover:text-red-700 transition" title="Delete">
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

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm overflow-hidden">
          <div className="card-rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:border-paper/20 dark:bg-[#14151A] dark:text-paper">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">Edit Service</div>
                <h3 className="font-bold text-lg mt-1">{editingService.name}</h3>
              </div>
              <button onClick={closeEditor} className="pill-btn text-xs flex-shrink-0">Close</button>
            </div>

            <form onSubmit={handleUpdateService} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60 dark:text-paper/50">Service Name</label>
                <input required placeholder="Service name" className="w-full p-2 text-sm border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60 dark:text-paper/50">Slug</label>
                <input required placeholder="URL-friendly slug" className="w-full p-2 text-sm border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60 dark:text-paper/50">Price (₹)</label>
                <input required type="number" placeholder="499" className="w-full p-2 text-sm border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60 dark:text-paper/50">Duration (minutes)</label>
                <input required type="number" placeholder="e.g., 120" min="5" max="600" className="w-full p-2 text-sm border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20" value={editForm.durationMinutes} onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60 dark:text-paper/50">Category</label>
                <select
                  required
                  className="w-full p-2 text-sm border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60 dark:text-paper/50">Description</label>
                <textarea required placeholder="Service description..." className="w-full p-2 text-sm border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20 h-20" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60 dark:text-paper/50">Image</label>
                <input placeholder="Image URL" className="w-full p-2 text-sm border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-2" value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} />
                <div className="border-t border-ink/10 dark:border-paper/10 pt-2">
                  <div className="text-xs text-ink/60 dark:text-paper/50 mb-2">Or upload new image:</div>
                  <input type="file" accept="image/*" className="w-full text-xs" onChange={async (e) => {
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
                {editForm.image && <img src={editForm.image} alt="Preview" className="h-12 w-12 object-cover rounded-lg mt-2" />}
              </div>

              <div className="md:col-span-2 flex gap-2 pt-2">
                <button type="button" onClick={closeEditor} className="flex-1 px-3 py-2 rounded-lg border border-ink/20 dark:border-paper/20 hover:bg-ink/5 dark:hover:bg-paper/5 transition font-medium text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 px-3 py-2 bg-ink text-paper dark:bg-paper dark:text-ink rounded-lg font-medium text-xs uppercase tracking-widest hover:opacity-90 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-sm border border-paper/10 bg-paper p-8 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:border-paper/20 dark:bg-[#14151A] dark:text-paper">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-400/10">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-center mb-2">Delete Service</h3>
            <p className="text-center text-ink/70 dark:text-paper/70 mb-6">
              Are you sure you want to delete <strong className="text-red-600 dark:text-red-400">{deleteModal.serviceName}</strong>? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, serviceId: null, serviceName: '' })}
                className="flex-1 px-4 py-3 rounded-xl border border-ink/20 dark:border-paper/20 hover:bg-ink/5 dark:hover:bg-paper/5 transition font-medium uppercase tracking-widest text-sm"
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
