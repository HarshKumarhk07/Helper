import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listServices, createService, deleteService } from '../../api/services.js';
import api from '../../api/axios.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { Trash2 } from 'lucide-react';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newService, setNewService] = useState({
    name: '', slug: '', description: '', price: '', category: '', image: '', duration: ''
  });

  const load = () => {
    setLoading(true);
    listServices()
      .then(setServices)
      .catch(() => toast.error('Failed to load services'))
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
      await createService({ ...newService, price: Number(newService.price) });
      toast.success('Service created');
      setShowForm(false);
      setNewService({ name: '', slug: '', description: '', price: '', category: '', image: '', duration: '' });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      toast.success('Service deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete service');
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
              <input required placeholder="Service Name" className="p-3 border rounded-xl" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} />
              <input required placeholder="Slug" className="p-3 border rounded-xl" value={newService.slug} onChange={(e) => setNewService({...newService, slug: e.target.value})} />
              <input required type="number" placeholder="Price (₹)" className="p-3 border rounded-xl" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} />
              <input required placeholder="Duration (e.g. 2 hours)" className="p-3 border rounded-xl" value={newService.duration} onChange={(e) => setNewService({...newService, duration: e.target.value})} />
              <input required placeholder="Category ID" className="p-3 border rounded-xl" value={newService.category} onChange={(e) => setNewService({...newService, category: e.target.value})} />
            </div>
            
            <textarea required placeholder="Description" className="w-full p-3 border rounded-xl mb-4 h-24" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} />
            
            <div className="mb-6">
              <label className="block text-sm mb-2 font-medium">Service Image (Cloudinary)</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="p-2 border rounded-xl flex-1 bg-white" />
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
                    <button onClick={() => handleDelete(s._id)} className="text-red-500"><Trash2 size={16} /></button>
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
