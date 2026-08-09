const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    leadTimeDays: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', SupplierSchema);
module.exports = Supplier;
