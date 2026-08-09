const Supplier = require('../Models/Supplier');

exports.createSupplier = async (req, res) => {
    try {
        const { name, contactPerson, email, phone, address, leadTimeDays } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ message: 'Supplier name and phone are required' });
        }
        const supplier = new Supplier({ name, contactPerson, email, phone, address, leadTimeDays });
        await supplier.save();
        res.status(201).json({ message: 'Supplier created successfully', supplier });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json({ message: 'Suppliers retrieved successfully', suppliers });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json({ message: 'Supplier retrieved successfully', supplier });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json({ message: 'Supplier updated successfully', supplier });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
