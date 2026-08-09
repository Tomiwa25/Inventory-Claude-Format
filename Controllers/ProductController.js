const Product = require('../Models/Product');

//Create a new product
exports.createProduct = async (req, res) => {
    try {
        if (!req.body.name || !req.body.sku || !req.body.size || !req.body.description || !req.body.price || req.body.quantity === undefined ) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const { name, sku, size, description, price, costPrice, quantity, category, supplier, reorderPoint, reorderQuantity, imageUrl } = req.body;
        const product = new Product({ name, sku, size, description, price, costPrice, quantity, category, supplier, reorderPoint, reorderQuantity, imageUrl });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A product with that SKU already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

//update a product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.body.name || !req.body.size || !req.body.description || !req.body.price || req.body.quantity === undefined ) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // Note: quantity is intentionally editable here for convenience, but for anything
        // that needs an audit trail (receiving stock, sales, corrections) use the
        // /stock/in, /stock/out, /stock/adjust endpoints instead -- they create a
        // StockMovement record. Direct edits here do not.
        const { name, sku, size, description, price, costPrice, quantity, category, supplier, reorderPoint, reorderQuantity, imageUrl } = req.body;
        const product = await Product.findByIdAndUpdate(
            id,
            { name, sku, size, description, price, costPrice, quantity, category, supplier, reorderPoint, reorderQuantity, imageUrl },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//Get all products -- supports ?search=&category=&supplier=&page=&limit=&sort=
exports.getAllProducts = async (req, res) => {
    try {
        const { search, category, supplier, page = 1, limit = 25, sort = '-createdAt' } = req.query;
        const filter = {};
        if (search) filter.$text = { $search: search };
        if (category) filter.category = category;
        if (supplier) filter.supplier = supplier;

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .populate('supplier', 'name')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            message: 'Products retrieved successfully',
            products,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

//Get a single product by ID
exports.getProductById = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }   
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product retrieved successfully', product });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//Delete a product by ID
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully', product });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
