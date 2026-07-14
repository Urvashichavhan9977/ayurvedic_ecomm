/**
 * DEPRECATED — do not use.
 *
 * Admin/superadmin accounts now live in the single `User` model
 * (backend/src/models/User.js), which has role: 'user' | 'admin' | 'superadmin'.
 * This file is kept only so that a stray `require('../models/Admin')`
 * fails loudly instead of silently reading from an old/empty collection.
 *
 * Use `require('../models/User')` instead.
 */
throw new Error(
  "models/Admin.js is deprecated. Admin/superadmin accounts now live in models/User.js (role field) — require('../models/User') instead."
);
