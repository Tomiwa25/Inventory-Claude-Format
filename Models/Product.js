const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    size: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        // selling price
        type: Number,
        required: true
    },
    costPrice: {
        // what you pay the supplier -- used for stock valuation reports
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    reorderPoint: {
        // when quantity drops to/below this, product shows up in low-stock report
        type: Number,
        default: 0
    },
    reorderQuantity: {
        // suggested quantity to reorder when restocking
        type: Number,
        default: 0
    },
    imageUrl: {
        type: String
    }
}, 
{ timestamps: true } //Date and time of creation and update
);

ProductSchema.index({ name: 'text', sku: 'text' });

// Create Model
const Product = mongoose.model('Product', ProductSchema);

// Export Model
module.exports = Product;