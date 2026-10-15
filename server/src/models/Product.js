import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      index: true,
    },
    // Stored as integer paise for INR (e.g. ₹1,499.00 = 149900 paise) to prevent floating-point errors
    pricePaise: {
      type: Number,
      required: [true, 'Product price in paise is required'],
      min: [100, 'Price must be at least 100 paise (₹1.00)'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer. Price must be stored in whole paise.',
      },
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Product image URL is required'],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer. Stock must be a whole number.',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for price in Rupees (for display/read convenience)
productSchema.virtual('priceRupees').get(function () {
  return this.pricePaise / 100;
});

// Helper function to create URL-friendly slug
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// Pre-save hook to generate slug automatically if not specified or name changed
productSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = generateSlug(this.name);
    // Append a 6-char random alphanumeric suffix to guarantee uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    this.slug = `${baseSlug}-${randomSuffix}`;
  }
  next();
});

// Compound index for search and category filtering
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ category: 1, isActive: 1, pricePaise: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
