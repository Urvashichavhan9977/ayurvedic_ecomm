require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

// One-time fix: products created before the multi-vendor upgrade never had
// `approvalStatus` (and, in some very old records, `isActive`) written to
// MongoDB. The storefront query now falls back to treating a missing field
// as "approved"/"active" automatically, but it's cleaner to also backfill
// the real documents so every product has explicit, correct values going
// forward. Safe to run any number of times — it only touches documents
// that are missing the field.

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const approvalResult = await Product.updateMany(
    { approvalStatus: { $exists: false } },
    { $set: { approvalStatus: 'approved' } }
  );
  console.log(`approvalStatus backfilled on ${approvalResult.modifiedCount} product(s).`);

  const activeResult = await Product.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  console.log(`isActive backfilled on ${activeResult.modifiedCount} product(s).`);

  const vendorResult = await Product.updateMany(
    { vendor: { $exists: false } },
    { $set: { vendor: null } }
  );
  console.log(`vendor backfilled on ${vendorResult.modifiedCount} product(s).`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('ERROR', err.message);
  process.exit(1);
});
