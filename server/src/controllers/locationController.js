import Location from '../models/Location.js';

export const getLocations = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role !== 'admin') {
      filter.isActive = true;
    }
    const locations = await Location.find(filter).sort({ name: 1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locations', error: error.message });
  }
};

export const createLocation = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const location = new Location({ name, slug, isActive });
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create location', error: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const updateData = { isActive };
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    const location = await Location.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update location', error: error.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json({ message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete location', error: error.message });
  }
};
