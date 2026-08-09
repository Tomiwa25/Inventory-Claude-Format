const SalesOrder = require('../Models/SalesOrder');
const { _applyMovement } = require('./StockController');

exports.createSalesOrder = async (req, res) => {
    try {
        const { customerName, items } = req.body;
        if (!customerName || !items || !items.length) {
            return res.status(400).json({ message: 'customerName and at least one item are required' });
        }
        const so = new SalesOrder({ customerName, items, createdBy: req.user._id });
        await so.save();
        res.status(201).json({ message: 'Sales order created successfully', salesOrder: so });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllSalesOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 25 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            SalesOrder.find(filter)
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            SalesOrder.countDocuments(filter)
        ]);

        res.status(200).json({
            message: 'Sales orders retrieved successfully',
            salesOrders: orders,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSalesOrderById = async (req, res) => {
    try {
        const so = await SalesOrder.findById(req.params.id)
            .populate('items.product', 'name sku price')
            .populate('createdBy', 'name');
        if (!so) {
            return res.status(404).json({ message: 'Sales order not found' });
        }
        res.status(200).json({ message: 'Sales order retrieved successfully', salesOrder: so });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Fulfilling a sales order decrements stock for every line item.
// If any line has insufficient stock, the whole fulfillment is rejected (transactional per-line via applyMovement).
exports.fulfillSalesOrder = async (req, res) => {
    try {
        const so = await SalesOrder.findById(req.params.id);
        if (!so) {
            return res.status(404).json({ message: 'Sales order not found' });
        }
        if (so.status !== 'pending') {
            return res.status(400).json({ message: `Cannot fulfill a ${so.status} order` });
        }

        for (const line of so.items) {
            await _applyMovement({
                productId: line.product,
                type: 'OUT',
                quantity: line.quantity,
                reason: 'SALE',
                reference: so._id,
                referenceModel: 'SalesOrder',
                note: `Fulfilled sales order ${so._id}`,
                userId: req.user._id
            });
        }

        so.status = 'fulfilled';
        await so.save();
        res.status(200).json({ message: 'Sales order fulfilled successfully', salesOrder: so });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.cancelSalesOrder = async (req, res) => {
    try {
        const so = await SalesOrder.findById(req.params.id);
        if (!so) {
            return res.status(404).json({ message: 'Sales order not found' });
        }
        if (so.status === 'fulfilled') {
            return res.status(400).json({ message: 'Cannot cancel a fulfilled order' });
        }
        so.status = 'cancelled';
        await so.save();
        res.status(200).json({ message: 'Sales order cancelled successfully', salesOrder: so });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
