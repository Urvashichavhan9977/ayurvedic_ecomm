const User = require('../models/User');
const VendorTransaction = require('../models/VendorTransaction');

/**
 * Walks an (already-fetched, not-yet-saved) Order document and, for every
 * line item that:
 *   - belongs to a vendor (item.vendor is set)
 *   - is now 'Delivered'
 *   - has not already been credited (item.commissionCredited === false)
 * credits that vendor's wallet with their commissionRate % share of the
 * line's sale value, writes a VendorTransaction ledger entry, and marks
 * the item as credited (so it's never double-paid).
 *
 * IMPORTANT: this only mutates `order` in memory + saves the affected
 * User docs. The caller is still responsible for calling `order.save()`
 * afterwards.
 *
 * @param {import('mongoose').Document} order
 * @returns {Promise<number>} number of items credited
 */
async function creditVendorEarnings(order) {
  const itemsToCredit = order.orderItems.filter(
    (item) => item.vendor && item.vendorItemStatus === 'Delivered' && !item.commissionCredited
  );

  if (itemsToCredit.length === 0) return 0;

  // Fetch every distinct vendor involved once, rather than per-item.
  const vendorIds = [...new Set(itemsToCredit.map((i) => String(i.vendor)))];
  const vendors = await User.find({ _id: { $in: vendorIds } });
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  for (const item of itemsToCredit) {
    const vendor = vendorMap.get(String(item.vendor));
    if (!vendor) continue;

    const rate = vendor.commissionRate ?? 5;
    const saleAmount = item.price * item.qty;
    const amount = Math.round((saleAmount * rate) / 100);

    vendor.walletBalance = (vendor.walletBalance || 0) + amount;
    vendor.totalEarnings = (vendor.totalEarnings || 0) + amount;

    item.vendorEarning = amount;
    item.commissionCredited = true;

    // eslint-disable-next-line no-await-in-loop
    await VendorTransaction.create({
      vendor: vendor._id,
      order: order._id,
      orderId: order.orderId,
      product: item.product,
      productName: item.name,
      qty: item.qty,
      saleAmount,
      commissionRate: rate,
      amount,
      type: 'credit',
      note: `Commission for order ${order.orderId}`,
    });
  }

  await Promise.all([...vendorMap.values()].map((v) => v.save({ validateBeforeSave: false })));

  return itemsToCredit.length;
}

module.exports = { creditVendorEarnings };
