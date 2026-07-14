/**
 * Chainable query-builder helper used by public/admin list endpoints to
 * apply filtering, text search, sorting, field limiting, and pagination
 * on top of a Mongoose Query object.
 *
 * Usage:
 *   const features = new ApiFeatures(Product.find(), req.query)
 *     .filter()
 *     .search(['name', 'description'])
 *     .sort('-createdAt')
 *     .limitFields()
 *     .paginate();
 *   const docs = await features.query;
 *   const total = await features.countTotal(Product);
 */
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'keyword'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Support gte/gt/lte/lt operators, e.g. price[gte]=100
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const parsed = JSON.parse(queryStr);

    // Drop empty-string values so unset filters don't over-constrain results
    Object.keys(parsed).forEach((key) => {
      if (parsed[key] === '' || parsed[key] === undefined) delete parsed[key];
    });

    this.query = this.query.find(parsed);
    return this;
  }

  search(fields = []) {
    const term = this.queryString.search || this.queryString.keyword;
    if (term && fields.length > 0) {
      const regex = { $regex: term, $options: 'i' };
      this.query = this.query.find({
        $or: fields.map((field) => ({ [field]: regex })),
      });
    }
    return this;
  }

  sort(defaultSort = '-createdAt') {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort(defaultSort);
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /**
   * @param {number} maxLimit  Hard ceiling on `?limit=`. Public storefront
   *                           routes keep the safe default (100) so nobody
   *                           can pull the whole catalog in one request.
   *                           Admin management screens (Trending Products,
   *                           Shop by Concern product pickers, etc.) pass a
   *                           much higher ceiling so the admin can select
   *                           from their *entire* catalog, not just the
   *                           first page of it.
   */
  paginate(maxLimit = 100) {
    const page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(this.queryString.limit, 10) || 20, 1), maxLimit);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }

  /**
   * Re-runs the same filter/search predicate (without pagination) as a
   * countDocuments() call so callers can build { total, page, pages }.
   */
  async countTotal(Model, baseFilter = {}) {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'keyword'];
    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const parsed = JSON.parse(queryStr);
    Object.keys(parsed).forEach((key) => {
      if (parsed[key] === '' || parsed[key] === undefined) delete parsed[key];
    });

    const term = this.queryString.search || this.queryString.keyword;
    let filter = { ...baseFilter, ...parsed };
    if (term && this._searchFields) {
      filter = {
        ...filter,
        $or: this._searchFields.map((field) => ({ [field]: { $regex: term, $options: 'i' } })),
      };
    }

    return Model.countDocuments(filter);
  }
}

module.exports = ApiFeatures;
