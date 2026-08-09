const mongoose = require('mongoose');

// In serverless (Vercel/Lambda), each invocation can otherwise open a brand new
// connection, exhausting MongoDB's connection limit within minutes. Caching the
// connection promise on `global` lets it be reused across warm invocations.
let cached = global._mongoose;
if (!cached) {
    cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10
        }).then(m => {
            console.log(`MongoDB Connected: ${m.connection.host}`);
            return m;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error(`Error: ${error.message}`);
        throw error;
    }
    return cached.conn;
};

module.exports = connectDB;
