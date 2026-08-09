const Category = require('../Models/Category');

exports.createCategory = async (req, res) => {
    try {
        const { name, description, parentCategory } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const category = new Category({ name, description, parentCategory: parentCategory || null });
        await category.save();
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('parentCategory', 'name');
        res.status(200).json({ message: 'Categories retrieved successfully', categories });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('parentCategory', 'name');
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category retrieved successfully', category });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, description, parentCategory } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, parentCategory: parentCategory || null },
            { new: true, runValidators: true }
        );
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
