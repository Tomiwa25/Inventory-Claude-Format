const mongoose = require('mongoose');

// Immutable ledger of every stock change. Never edit or delete a movement --
// if a mistake is made, insert a correcting movement instead.
const StockMovementSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    type: {
        type: String,
        enum: ['IN', 'OUT', 'ADJUSTMENT'],
        required: true
    },
    quantity: {
        // Always positive; direction is determined by `type`
        type: Number,
        required: true,
        min: 1
    },
    previousQuantity: {
        type: Number,
        required: true
    },
    newQuantity: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        enum: ['PURCHASE_RECEIVED', 'SALE', 'MANUAL_ADJUSTMENT', 'DAMAGED', 'RETURNED', 'STOCK_TAKE'],
        required: true
    },
    reference: {
        // Optional link to the PurchaseOrder or SalesOrder that caused this movement
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceModel'
    },
    referenceModel: {
        type: String,
        enum: ['PurchaseOrder', 'SalesOrder']
    },
    note: {
        type: String
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

StockMovementSchema.index({ product: 1, createdAt: -1 });

const StockMovement = mongoose.model('StockMovement', StockMovementSchema);
module.exports = StockMovement;
