const mongoose = require('mongoose');

const POLineItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantityOrdered: {
        type: Number,
        required: true,
        min: 1
    },
    quantityReceived: {
        type: Number,
        default: 0
    },
    unitCost: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const PurchaseOrderSchema = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    items: {
        type: [POLineItemSchema],
        validate: v => Array.isArray(v) && v.length > 0
    },
    status: {
        type: String,
        enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'],
        default: 'draft'
    },
    expectedDate: {
        type: Date
    },
    receivedDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

PurchaseOrderSchema.virtual('totalCost').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantityOrdered * item.unitCost, 0);
});
PurchaseOrderSchema.set('toJSON', { virtuals: true });

const PurchaseOrder = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
module.exports = PurchaseOrder;
