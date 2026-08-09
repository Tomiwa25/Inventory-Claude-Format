// Vercel serverless entry point. Vercel routes any request under /api/* to this
// function; vercel.json rewrites all other paths here too, so the Express app
// itself still sees clean routes like /products, /users, etc.
module.exports = require('../app');
