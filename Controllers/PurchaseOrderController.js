const PurchaseOrder = require('../Models/PurchaseOrder');
const { _applyMovement } = require('./StockController');

exports.createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, items, expectedDate, notes } = req.body;
        if (!supplier || !items || !items.length) {
            return res.status(400).json({ message: 'supplier and at least one item are required' });
        }
        const po = new PurchaseOrder({
            supplier,
            items,
            expectedDate,
            notes,
            createdBy: req.user._id
        });
        await po.save();
        res.status(201).json({ message: 'Purchase order created successfully', purchaseOrder: po });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllPurchaseOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 25 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            PurchaseOrder.find(filter)
                .populate('supplier', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            PurchaseOrder.countDocuments(filter)
        ]);

        res.status(200).json({
            message: 'Purchase orders retrieved successfully',
            purchaseOrders: orders,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getPurchaseOrderById = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('supplier')
            .populate('items.product', 'name sku')
            .populate('createdBy', 'name');
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        res.status(200).json({ message: 'Purchase order retrieved successfully', purchaseOrder: po });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updatePurchaseOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['draft', 'ordered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status transition. Use the receive endpoint to mark items received.' });
        }
        const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        res.status(200).json({ message: 'Purchase order updated successfully', purchaseOrder: po });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Receive some or all of a PO's line items -- this is what actually moves stock.
// Body: { receivedItems: [{ productId, quantityReceived }] }
exports.receivePurchaseOrder = async (req, res) => {
    try {
        const { receivedItems } = req.body;
        if (!receivedItems || !receivedItems.length) {
            return res.status(400).json({ message: 'receivedItems is required' });
        }

        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        if (po.status === 'received' || po.status === 'cancelled') {
            return res.status(400).json({ message: `Cannot receive against a ${po.status} order` });
        }

        for (const received of receivedItems) {
            const line = po.items.find(i => i.product.toString() === received.productId);
            if (!line) {
                return res.status(400).json({ message: `Product ${received.productId} is not on this purchase order` });
            }
            const remaining = line.quantityOrdered - line.quantityReceived;
            const qty = Number(received.quantityReceived);
            if (qty <= 0 || qty > remaining) {
                return res.status(400).json({ message: `Invalid received quantity for product ${received.productId}; ${remaining} remaining` });
            }

            await _applyMovement({
                productId: line.product,
                type: 'IN',
                quantity: qty,
                reason: 'PURCHASE_RECEIVED',
                reference: po._id,
                referenceModel: 'PurchaseOrder',
                note: `Received against PO ${po._id}`,
                userId: req.user._id
            });

            line.quantityReceived += qty;
        }

        const allReceived = po.items.every(i => i.quantityReceived >= i.quantityOrdered);
        const someReceived = po.items.some(i => i.quantityReceived > 0);
        po.status = allReceived ? 'received' : (someReceived ? 'partially_received' : po.status);
        if (allReceived) po.receivedDate = new Date();

        await po.save();
        res.status(200).json({ message: 'Purchase order received successfully', purchaseOrder: po });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
