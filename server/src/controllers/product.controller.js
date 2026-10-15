import mongoose from 'mongoose';
import Product from '../models/Product.js';

/**
 * @route   GET /api/v1/products
 * @desc    Get paginated, filtered, and sorted products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      sort,
      inStockOnly,
      page = 1,
      limit = 12,
      includeInactive,
    } = req.query;

    const query = {};

    // Only active products by default unless explicitly permitted
    if (!includeInactive) {
      query.isActive = true;
    }

    // Search filter (name, description, category)
    if (search && search.trim() !== '') {
      const sanitizedSearch = search.trim();
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
        { category: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category.toLowerCase() !== 'all') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Stock availability filter
    if (inStockOnly === 'true' || inStockOnly === true) {
      query.stock = { $gt: 0 };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort === 'price-asc') {
      sortOptions = { pricePaise: 1 };
    } else if (sort === 'price-desc') {
      sortOptions = { pricePaise: -1 };
    } else if (sort === 'name-asc') {
      sortOptions = { name: 1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/products/categories
 * @desc    Get list of unique product categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categories.sort(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get single product by MongoDB ID or slug
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).lean();
    } else {
      // If not a valid ObjectId, search by slug
      product = await Product.findOne({ slug: id }).lean();
    }

    if (!product || (!product.isActive && req.query.includeInactive !== 'true')) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product (Admin)
 * @access  Private/Admin
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, pricePaise, imageUrl, stock, rating } = req.body;

    if (!name || !description || !category || pricePaise === undefined || !imageUrl || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, description, category, pricePaise, imageUrl, stock.',
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      pricePaise: Math.round(Number(pricePaise)),
      imageUrl,
      stock: Math.round(Number(stock)),
      rating: rating ? Number(rating) : 4.5,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/products/:id
 * @desc    Update a product (Admin)
 * @access  Private/Admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const updateData = { ...req.body };
    if (updateData.pricePaise !== undefined) {
      updateData.pricePaise = Math.round(Number(updateData.pricePaise));
    }
    if (updateData.stock !== undefined) {
      updateData.stock = Math.round(Number(updateData.stock));
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product (Admin)
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      productId: id,
    });
  } catch (error) {
    next(error);
  }
};
