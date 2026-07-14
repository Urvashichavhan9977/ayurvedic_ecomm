const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get a searchable, filterable, sortable, paginated list of
 *          customers for the admin Users Management screen. Each row is
 *          annotated with orderCount / totalSpent computed from the Order
 *          collection so the admin can see customer value at a glance.
 * @route   GET /api/v1/users/admin/all
 * @access  Private/Admin
 * Query params: search, isActive, isVerified, sort, page, limit
 */
const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const { search, isActive, isVerified } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  // Since admins/superadmins now share the User collection, exclude them
  // from the customer-management list by default.
  const filter = { role: 'user' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: '-createdAt',
    oldest: 'createdAt',
    name: 'name',
  };
  const sort = sortMap[req.query.sort] || '-createdAt';

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((u) => u._id);
  const orderStats = userIds.length
    ? await Order.aggregate([
        { $match: { user: { $in: userIds } } },
        {
          $group: {
            _id: '$user',
            orderCount: { $sum: 1 },
            totalSpent: {
              $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] },
            },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
      ])
    : [];

  const statsByUser = new Map(orderStats.map((s) => [String(s._id), s]));

  const usersWithStats = users.map((u) => {
    const stats = statsByUser.get(String(u._id));
    return {
      ...u.toObject(),
      orderCount: stats?.orderCount || 0,
      totalSpent: stats?.totalSpent || 0,
      lastOrderAt: stats?.lastOrderAt || null,
    };
  });

  res.status(200).json({
    success: true,
    count: usersWithStats.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users: usersWithStats,
  });
});

/**
 * @desc    Get a single customer's profile plus their recent order history,
 *          for the admin user-detail view.
 * @route   GET /api/v1/users/admin/:id
 * @access  Private/Admin
 */
const getUserAdmin = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const orders = await Order.find({ user: user._id }).sort('-createdAt').limit(20);

  const [summary] = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        totalSpent: {
          $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    user,
    orders,
    orderCount: summary?.orderCount || 0,
    totalSpent: summary?.totalSpent || 0,
  });
});

/**
 * @desc    Activate or deactivate a customer account (blocks/unblocks
 *          login without deleting their data or order history).
 * @route   PATCH /api/v1/users/:id/status
 * @access  Private/Admin
 * Body: { isActive } — if omitted, the current value is toggled.
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  user.isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !user.isActive;
  await user.save();

  res.status(200).json({ success: true, user });
});

/**
 * @desc    Store-wide customer analytics for the admin Dashboard: total
 *          users, active/inactive split, new signups this month, and the
 *          most recently registered customers.
 * @route   GET /api/v1/users/admin/stats
 * @access  Private/Admin
 */
const getUserStatsAdmin = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totals] = await User.aggregate([
    { $match: { role: 'user' } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
      },
    },
  ]);

  const newUsersThisMonth = await User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } });

  const recentUsers = await User.find({ role: 'user' }).sort('-createdAt').limit(5);

  res.status(200).json({
    success: true,
    totalUsers: totals?.totalUsers || 0,
    activeUsers: totals?.activeUsers || 0,
    inactiveUsers: (totals?.totalUsers || 0) - (totals?.activeUsers || 0),
    verifiedUsers: totals?.verifiedUsers || 0,
    newUsersThisMonth,
    recentUsers,
  });
});

module.exports = {
  getAllUsersAdmin,
  getUserAdmin,
  updateUserStatus,
  getUserStatsAdmin,
};
