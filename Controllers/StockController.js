const mongoose = require('mongoose');
const Product = require('../Models/Product');
const StockMovement = require('../Models/StockMovement');

// Core rule: never mutate Product.quantity directly anywhere else in the app.
// Every change goes through one of these three functions so a StockMovement
// row is always created alongside it, inside the same transaction.

const applyMovement = async ({ productId, type, quantity, reason, reference, referenceModel, note, userId }) => {
    if (!quantity || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
    }

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            const product = await Product.findById(productId).session(session);
            if (!product) {
                throw new Error('Product not found');
            }

            const previousQuantity = product.quantity;
            let newQuantity;

            if (type === 'IN') {
                newQuantity = previousQuantity + quantity;
            } else if (type === 'OUT') {
                if (previousQuantity < quantity) {
                    throw new Error(`Insufficient stock: only ${previousQuantity} unit(s) available`);
                }
                newQuantity = previousQuantity - quantity;
            } else if (type === 'ADJUSTMENT') {
                // For adjustments, `quantity` is the new absolute quantity, not a delta
                newQuantity = quantity;
            } else {
                throw new Error('Invalid movement type');
            }

            product.quantity = newQuantity;
            await product.save({ session });

            const [movement] = await StockMovement.create([{
                product: productId,
                type,
                quantity: type === 'ADJUSTMENT' ? Math.abs(newQuantity - previousQuantity) || 1 : quantity,
                previousQuantity,
                newQuantity,
                reason,
                reference: reference || undefined,
                referenceModel: referenceModel || undefined,
                note,
                performedBy: userId
            }], { session });

            result = { product, movement };
        });
        return result;
    } finally {
        session.endSession();
    }
};

exports.stockIn = async (req, res) => {
    try {
        const { productId, quantity, reason, note } = req.body;
        if (!productId || !quantity) {
            return res.status(400).json({ message: 'productId and quantity are required' });
        }
        const { product, movement } = await applyMovement({
            productId,
            type: 'IN',
            quantity: Number(quantity),
            reason: reason || 'PURCHASE_RECEIVED',
            note,
            userId: req.user._id
        });
        res.status(200).json({ message: 'Stock added successfully', product, movement });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { productId, quantity, reason, note } = req.body;
        if (!productId || !quantity) {
            return res.status(400).json({ message: 'productId and quantity are required' });
        }
        const { product, movement } = await applyMovement({
            productId,
            type: 'OUT',
            quantity: Number(quantity),
            reason: reason || 'SALE',
            note,
            userId: req.user._id
        });
        res.status(200).json({ message: 'Stock removed successfully', product, movement });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.adjustStock = async (req, res) => {
    try {
        const { productId, newQuantity, note } = req.body;
        if (!productId || newQuantity === undefined || newQuantity < 0) {
            return res.status(400).json({ message: 'productId and a valid newQuantity are required' });
        }
        const { product, movement } = await applyMovement({
            productId,
            type: 'ADJUSTMENT',
            quantity: Number(newQuantity),
            reason: 'MANUAL_ADJUSTMENT',
            note,
            userId: req.user._id
        });
        res.status(200).json({ message: 'Stock adjusted successfully', product, movement });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Read-only ledger, filterable by product / type / date range
exports.getMovements = async (req, res) => {
    try {
        const { productId, type, startDate, endDate, page = 1, limit = 25 } = req.query;
        const filter = {};
        if (productId) filter.product = productId;
        if (type) filter.type = type;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [movements, total] = await Promise.all([
            StockMovement.find(filter)
                .populate('product', 'name sku')
                .populate('performedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            StockMovement.countDocuments(filter)
        ]);

        res.status(200).json({
            message: 'Stock movements retrieved successfully',
            movements,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getLowStock = async (req, res) => {
    try {
        const products = await Product.find({ $expr: { $lte: ['$quantity', '$reorderPoint'] } })
            .populate('category', 'name')
            .populate('supplier', 'name');
        res.status(200).json({ message: 'Low stock products retrieved successfully', products });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getStockValuation = async (req, res) => {
    try {
        const products = await Product.find();
        const valuation = products.map(p => ({
            product: p.name,
            sku: p.sku,
            quantity: p.quantity,
            costPrice: p.costPrice,
            totalValue: p.quantity * p.costPrice
        }));
        const totalValue = valuation.reduce((sum, v) => sum + v.totalValue, 0);
        res.status(200).json({ message: 'Stock valuation retrieved successfully', valuation, totalValue });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// exported for reuse by PurchaseOrder/SalesOrder controllers
exports._applyMovement = applyMovement;
