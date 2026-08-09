const Product = require('../Models/Product');
const StockMovement = require('../Models/StockMovement');
const PurchaseOrder = require('../Models/PurchaseOrder');

exports.getSummary = async (req, res) => {
    try {
        const [products, lowStockCount, pendingPOs, recentMovements] = await Promise.all([
            Product.find(),
            Product.countDocuments({ $expr: { $lte: ['$quantity', '$reorderPoint'] } }),
            PurchaseOrder.countDocuments({ status: { $in: ['draft', 'ordered', 'partially_received'] } }),
            StockMovement.find().sort({ createdAt: -1 }).limit(10).populate('product', 'name sku')
        ]);

        const totalStockValue = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
        const totalProducts = products.length;
        const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

        res.status(200).json({
            message: 'Dashboard summary retrieved successfully',
            summary: {
                totalProducts,
                totalUnits,
                totalStockValue,
                lowStockCount,
                pendingPurchaseOrders: pendingPOs
            },
            recentMovements
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
