const mongoose = require('mongoose');

const SOLineItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const SalesOrderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    items: {
        type: [SOLineItemSchema],
        validate: v => Array.isArray(v) && v.length > 0
    },
    status: {
        type: String,
        enum: ['pending', 'fulfilled', 'cancelled'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

SalesOrderSchema.virtual('totalAmount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
});
SalesOrderSchema.set('toJSON', { virtuals: true });

const SalesOrder = mongoose.model('SalesOrder', SalesOrderSchema);
module.exports = SalesOrder;
