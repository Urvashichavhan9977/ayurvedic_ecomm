/**
 * Must run after `protect` + `authorize('vendor')`. Blocks vendors whose
 * application hasn't been approved yet (pending/rejected/suspended) from
 * selling actions, while still letting them view their own profile/status.
 */
const requireApprovedVendor = (req, res, next) => {
  if (!req.user || req.user.role !== 'vendor') {
    return res.status(403).json({ success: false, message: 'Vendor access only.' });
  }

  if (req.user.vendorStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message:
        req.user.vendorStatus === 'pending'
          ? 'Your vendor application is still under review.'
          : req.user.vendorStatus === 'rejected'
          ? `Your vendor application was rejected.${req.user.rejectionReason ? ' Reason: ' + req.user.rejectionReason : ''}`
          : 'Your vendor account has been suspended. Please contact support.',
      vendorStatus: req.user.vendorStatus,
    });
  }

  next();
};

module.exports = { requireApprovedVendor };
