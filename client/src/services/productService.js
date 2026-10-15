import api from './api';

export const productService = {
  /**
   * Fetch paginated and filtered products
   * @param {Object} params - Query parameters { search, category, sort, inStockOnly, page, limit }
   */
  async getProducts(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  /**
   * Fetch single product by ID or slug
   * @param {string} idOrSlug - MongoDB ObjectId or product slug
   */
  async getProductById(idOrSlug) {
    const response = await api.get(`/products/${idOrSlug}`);
    return response.data;
  },

  /**
   * Fetch distinct product categories
   */
  async getCategories() {
    const response = await api.get('/products/categories');
    return response.data;
  },
};

export default productService;
