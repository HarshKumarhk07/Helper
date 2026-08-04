import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listServices, createService, deleteService, updateService } from '../../api/services.js';
import { listCategories } from '../../api/categories.js';
import api from '../../api/axios.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { Trash2, AlertTriangle, Edit2, Star } from 'lucide-react';
import { resolveCatalogImage, CATALOG_PLACEHOLDER_IMAGE } from '../../lib/catalogImage.js';
import { mediaUrl } from '../../lib/catalogImage.js';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, serviceId: null, serviceName: '' });
  const [editingService, setEditingService] = useState(null);
  
  const [newService, setNewService] = useState({
    name: '', description: '', pricingType: 'fixed', fixedPrice: '', hourlyRate: '',
    category: '', image: '', durationMinutes: '', locations: []
  });

  const [editForm, setEditForm] = useState({
    name: '', description: '', pricingType: 'fixed', fixedPrice: '', hourlyRate: '',
    category: '', image: '', durationMinutes: '', locations: []
  });

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const load = () => {
    setLoading(true);
    listServices({ includeHidden: true }) // [CAR-TRIPS DISABLED] admin retains full visibility
      .then(setServices)
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    listCategories({ active: 'true', includeHidden: true }) // [CAR-TRIPS DISABLED] admin retains full visibility
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'));
    api.get('/locations')
      .then(res => setLocations(res.data))
      .catch(() => toast.error('Failed to load locations'));
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
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Build the pricing part of the payload: send only the field that matches
  // the chosen pricingType so no stale value reaches the server. The backend
  // syncs `price` from whichever one is present.
  const buildPricingPayload = (form) =>
    form.pricingType === 'hourly'
      ? { pricingType: 'hourly', hourlyRate: Number(form.hourlyRate) }
      : { pricingType: 'fixed', fixedPrice: Number(form.fixedPrice) };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createService({
        name: newService.name,
        description: newService.description,
        image: newService.image,
        locations: newService.locations,
        ...buildPricingPayload(newService),
        slug: slugify(newService.name),
        category: newService.category,
        durationMinutes: newService.durationMinutes ? Number(newService.durationMinutes) : 60
      });
      toast.success('Service created');
      setShowForm(false);
      setNewService({ name: '', description: '', pricingType: 'fixed', fixedPrice: '', hourlyRate: '', category: '', image: '', durationMinutes: '', locations: [] });
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
    // Default to the (migrated) pricingType; pre-fill both rate fields so a
    // later toggle already has the right value. Falls back to `price` for any
    // service not yet carrying the typed fields.
    const pricingType = service.pricingType === 'hourly' ? 'hourly' : 'fixed';
    setEditForm({
      name: service.name || '',
      description: service.description || '',
      pricingType,
      fixedPrice: service.fixedPrice ?? (pricingType === 'fixed' ? service.price : '') ?? '',
      hourlyRate: service.hourlyRate ?? (pricingType === 'hourly' ? service.price : '') ?? '',
      category: service.category?._id || service.category || '',
      image: service.image || '',
      durationMinutes: service.durationMinutes || '',
      locations: service.locations || [],
    });
  };

  const closeEditor = () => {
    setEditingService(null);
    setEditForm({ name: '', description: '', pricingType: 'fixed', fixedPrice: '', hourlyRate: '', category: '', image: '', durationMinutes: '', locations: [] });
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editForm.name,
        description: editForm.description,
        image: editForm.image,
        ...buildPricingPayload(editForm),
        slug: slugify(editForm.name),
        category: editForm.category || null,
        durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) : 60,
        locations: editForm.locations || []
      };
      const updated = await updateService(editingService._id, payload);
      setServices((current) => current.map((s) => (s._id === updated._id ? updated : s)));
      toast.success('Service updated successfully');
      closeEditor();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update service');
    }
  };

  const handleToggleFeatured = async (svc) => {
    try {
      const updated = await updateService(svc._id, { isFeatured: !svc.isFeatured });
      setServices((current) => current.map((s) => (s._id === updated._id ? updated : s)));
      toast.success(updated.isFeatured ? 'Marked as featured' : 'Removed from featured');
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  return (
    <DashboardShell eyebrow="(Categories | pricing)" title="SERVICES, CATEGORIES | PRICING.">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">Categories | pricing</h2>
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
                <input required placeholder="e.g., TV Installation" className="w-full p-3 border rounded-xl bg-white" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Pricing Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewService({ ...newService, pricingType: 'fixed', hourlyRate: '' })}
                    className={`flex-1 rounded-xl px-3 py-3 text-xs font-medium uppercase tracking-widest border transition ${newService.pricingType === 'fixed' ? 'bg-ink text-paper border-ink' : 'bg-white text-ink/70 border-ink/20 hover:border-ink/40'}`}>
                    Fixed Price
                  </button>
                  <button type="button" onClick={() => setNewService({ ...newService, pricingType: 'hourly', fixedPrice: '' })}
                    className={`flex-1 rounded-xl px-3 py-3 text-xs font-medium uppercase tracking-widest border transition ${newService.pricingType === 'hourly' ? 'bg-ink text-paper border-ink' : 'bg-white text-ink/70 border-ink/20 hover:border-ink/40'}`}>
                    Per Hour
                  </button>
                </div>
              </div>
              {newService.pricingType === 'fixed' ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Fixed Price (₹)</label>
                  <input required type="number" min="0" placeholder="499" className="w-full p-3 border rounded-xl bg-white" value={newService.fixedPrice} onChange={(e) => setNewService({...newService, fixedPrice: e.target.value})} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Hourly Rate (₹ / hr)</label>
                  <input required type="number" min="0" placeholder="200" className="w-full p-3 border rounded-xl bg-white" value={newService.hourlyRate} onChange={(e) => setNewService({...newService, hourlyRate: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Duration (minutes)</label>
                <input required type="number" placeholder="e.g., 120" min="5" max="600" className="w-full p-3 border rounded-xl bg-white" value={newService.durationMinutes} onChange={(e) => setNewService({...newService, durationMinutes: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Category</label>
                <select
                  required
                  className="w-full p-3 border rounded-xl bg-white"
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
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Service Areas (Hold Ctrl/Cmd to select multiple. Leave empty for everywhere)</label>
                <select
                  multiple
                  className="w-full p-3 border rounded-xl bg-white"
                  value={newService.locations}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setNewService({ ...newService, locations: values });
                  }}
                >
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Description</label>
              <textarea required placeholder="Describe what's included in this service..." className="w-full p-3 border rounded-xl bg-white h-24" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} />
            </div>
            
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Service Image</label>
              <div className="border-t border-ink/10 pt-2">
                <div className="text-xs text-ink/60 mb-2">Upload a file:</div>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="p-2 border rounded-xl flex-1 bg-white" />
                  {uploading && <span className="text-sm">Uploading...</span>}
                  {newService.image && <img src={mediaUrl(newService.image)} alt="Preview" className="h-16 w-16 object-cover rounded-xl" />}
                </div>
              </div>
            </div>

            <button type="submit" className="pill-btn-solid" disabled={uploading}>Save Service</button>
          </form>
        </FadeUp>
      )}

      <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
            <tr>
              <th className="p-4 font-normal">Service</th>
              <th className="p-4 font-normal">Pricing</th>
              <th className="p-4 font-normal">Duration</th>
              <th className="p-4 font-normal">Visibility</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan="5" className="p-4">
                    <div className="skeleton h-12 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : services.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-ink/50">No services found.</td></tr>
            ) : (
              services.map(s => (
                <tr key={s._id} className="transition-colors hover:bg-sand/30 group">
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveCatalogImage(s)}
                        className="w-12 h-12 rounded object-cover border border-ink/10 bg-sand/50 shrink-0"
                        alt={s.name}
                        onError={(e) => {
                          e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div>
                        <div className="font-bold text-ink flex items-center gap-2">{s.name}</div>
                        <div className="text-[11px] text-ink/60 mt-0.5 line-clamp-1">{s.category?.name || s.category?.slug || 'Uncategorized'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top pt-6">
                    <div className="font-medium text-ink">
                      {s.pricingType === 'hourly'
                        ? <>₹{s.hourlyRate ?? s.price}<span className="text-ink/50 text-xs"> / hr</span></>
                        : <>₹{s.fixedPrice ?? s.price}</>}
                    </div>
                  </td>
                  <td className="p-4 align-top pt-6">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-ink/10 bg-ink/5 text-ink/70">
                      {s.durationMinutes} min
                    </span>
                  </td>
                  <td className="p-4 align-top pt-6">
                    <button
                      onClick={() => handleToggleFeatured(s)}
                      title={s.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        s.isFeatured
                          ? 'bg-amber-400 text-white hover:bg-amber-500'
                          : 'border border-ink/20 text-ink/50 hover:bg-ink/5 hover:text-ink/80'
                      }`}
                    >
                      {s.isFeatured ? <><Star size={10} fill="currentColor" /> Featured</> : 'Feature'}
                    </button>
                  </td>
                  <td className="p-4 align-top pt-5 text-right">
                    <button
                      onClick={() => openEditor(s)}
                      className="inline-flex items-center justify-center rounded-full border border-ink/20 bg-sand/30 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors focus:outline-none"
                    >
                      Manage
                    </button>
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
          <div className="card-rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60">Edit Service</div>
                <h3 className="font-bold text-lg mt-1">{editingService.name}</h3>
              </div>
              <button onClick={closeEditor} className="pill-btn text-xs flex-shrink-0">Close</button>
            </div>

            <form onSubmit={handleUpdateService} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Service Name</label>
                <input required placeholder="Service name" className="w-full p-2 text-sm border rounded-xl bg-white text-ink border-ink/20" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Pricing Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditForm({ ...editForm, pricingType: 'fixed', hourlyRate: '' })}
                    className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-medium uppercase tracking-widest border transition ${editForm.pricingType === 'fixed' ? 'bg-ink text-paper border-ink' : 'bg-white text-ink/70 border-ink/20 hover:border-ink/40'}`}>
                    Fixed
                  </button>
                  <button type="button" onClick={() => setEditForm({ ...editForm, pricingType: 'hourly', fixedPrice: '' })}
                    className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-medium uppercase tracking-widest border transition ${editForm.pricingType === 'hourly' ? 'bg-ink text-paper border-ink' : 'bg-white text-ink/70 border-ink/20 hover:border-ink/40'}`}>
                    Per Hour
                  </button>
                </div>
              </div>
              {editForm.pricingType === 'fixed' ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Fixed Price (₹)</label>
                  <input required type="number" min="0" placeholder="499" className="w-full p-2 text-sm border rounded-xl bg-white text-ink border-ink/20" value={editForm.fixedPrice} onChange={(e) => setEditForm({ ...editForm, fixedPrice: e.target.value })} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Hourly Rate (₹ / hr)</label>
                  <input required type="number" min="0" placeholder="200" className="w-full p-2 text-sm border rounded-xl bg-white text-ink border-ink/20" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} />
                </div>
              )}
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Duration (minutes)</label>
                <input required type="number" placeholder="e.g., 120" min="5" max="600" className="w-full p-2 text-sm border rounded-xl bg-white text-ink border-ink/20" value={editForm.durationMinutes} onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Category</label>
                <select
                  className="w-full p-2 text-sm border rounded-xl bg-white text-ink border-ink/20"
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
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Service Areas (Hold Ctrl/Cmd to select multiple. Leave empty for everywhere)</label>
                <select
                  multiple
                  className="w-full p-2 text-sm border rounded-xl bg-white text-ink border-ink/20"
                  value={editForm.locations}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setEditForm({ ...editForm, locations: values });
                  }}
                >
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Description</label>
                <textarea required placeholder="Service description..." className="w-full p-2 text-sm border rounded-xl bg-white text-ink border-ink/20 h-20" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Image</label>
                <div className="border-t border-ink/10 pt-2">
                  <div className="text-xs text-ink/60 mb-2">Upload new image:</div>
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
                {editForm.image && <img src={mediaUrl(editForm.image)} alt="Preview" className="h-12 w-12 object-cover rounded-lg mt-2" />}
              </div>

              <div className="md:col-span-2 flex flex-wrap justify-between items-center gap-4 mt-2 border-t border-ink/10 pt-6">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(editingService._id, editingService.name);
                    }}
                    className="text-xs uppercase tracking-widest font-bold text-red-600 hover:text-red-700 hover:underline px-2"
                  >
                    Delete Service
                  </button>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeEditor} className="pill-btn">Cancel</button>
                  <button type="submit" className="pill-btn-solid">Save changes</button>
                </div>
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
            <h3 className="text-xl font-bold text-center mb-2">Delete Service</h3>
            <p className="text-center text-ink/70 mb-6">
              Are you sure you want to delete <strong className="text-red-600">{deleteModal.serviceName}</strong>? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, serviceId: null, serviceName: '' })}
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
