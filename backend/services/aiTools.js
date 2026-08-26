import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';

/**
 * Helper to resolve ordinal or named product reference from recent context
 * E.g., "second one", "2nd", "first item", or part of name
 */
export const resolveProductFromContext = (ref, recentProducts = []) => {
  if (!recentProducts || recentProducts.length === 0) return null;
  if (!ref) return recentProducts[0];

  const refLower = String(ref).toLowerCase().trim();

  // English & Hinglish Ordinal matching
  if (refLower.includes('first') || refLower.includes('1st') || refLower.includes('pehla') || refLower.includes('pehli') || refLower.includes('pehle') || refLower === '1') return recentProducts[0];
  if (refLower.includes('second') || refLower.includes('2nd') || refLower.includes('doosra') || refLower.includes('dusra') || refLower.includes('doosri') || refLower.includes('dusri') || refLower.includes('doosre') || refLower.includes('dusre') || refLower === '2') return recentProducts[1] || recentProducts[0];
  if (refLower.includes('third') || refLower.includes('3rd') || refLower.includes('teesra') || refLower.includes('tisra') || refLower.includes('teesri') || refLower.includes('tisri') || refLower.includes('teesre') || refLower.includes('tisre') || refLower === '3') return recentProducts[2] || recentProducts[0];
  if (refLower.includes('fourth') || refLower.includes('4th') || refLower.includes('chautha') || refLower.includes('chauthi') || refLower === '4') return recentProducts[3] || recentProducts[0];
  if (refLower.includes('last') || refLower.includes('aakhri') || refLower.includes('akhri')) return recentProducts[recentProducts.length - 1];

  // ID match
  const idMatch = recentProducts.find(p => p._id && p._id.toString() === ref);
  if (idMatch) return idMatch;

  // Name keyword match
  const nameMatch = recentProducts.find(p => p.name && p.name.toLowerCase().includes(refLower));
  if (nameMatch) return nameMatch;

  // Default to first item if context exists
  return recentProducts[0];
};

/**
 * 1. Search Products in MongoDB with dynamic natural language criteria
 * Strictly queries live MongoDB collection productModel
 */
export const searchProducts = async (criteria = {}) => {
  try {
    const {
      query = '',
      category = '',
      subCategory = '',
      color = '',
      size = '',
      fit = '',
      material = '',
      occasion = '',
      brand = '',
      gender = '',
      minPrice = null,
      maxPrice = null,
      bestseller = null,
      limit = 6
    } = criteria;

    const dbQuery = {};

    // Category / Gender filter (e.g. Men, Women, Kids) - Strict regex match
    const targetCategory = category || gender;
    if (targetCategory && targetCategory.trim()) {
      dbQuery.category = { $regex: new RegExp(`^${targetCategory.trim()}$`, 'i') };
    }

    // SubCategory filter (e.g. Topwear, Bottomwear, Winterwear, T-Shirt, Shirt, Jeans, Dress, Pants)
    if (subCategory && subCategory.trim()) {
      dbQuery.subCategory = { $regex: new RegExp(subCategory.trim(), 'i') };
    }

    // Fit filter (Oversized, Regular, Slim)
    if (fit && fit.trim()) {
      dbQuery.$or = dbQuery.$or || [];
      dbQuery.$or.push(
        { fit: { $regex: new RegExp(fit.trim(), 'i') } },
        { description: { $regex: new RegExp(fit.trim(), 'i') } },
        { name: { $regex: new RegExp(fit.trim(), 'i') } }
      );
    }

    // Material / Fabric
    if (material && material.trim()) {
      dbQuery.$or = dbQuery.$or || [];
      dbQuery.$or.push(
        { material: { $regex: new RegExp(material.trim(), 'i') } },
        { fabric: { $regex: new RegExp(material.trim(), 'i') } },
        { description: { $regex: new RegExp(material.trim(), 'i') } }
      );
    }

    // Occasion
    if (occasion && occasion.trim()) {
      dbQuery.$or = dbQuery.$or || [];
      dbQuery.$or.push(
        { occasion: { $regex: new RegExp(occasion.trim(), 'i') } },
        { description: { $regex: new RegExp(occasion.trim(), 'i') } },
        { name: { $regex: new RegExp(occasion.trim(), 'i') } }
      );
    }

    // Brand
    if (brand && brand.trim()) {
      dbQuery.brand = { $regex: new RegExp(brand.trim(), 'i') };
    }

    // Bestseller
    if (bestseller !== null && bestseller !== undefined) {
      dbQuery.bestseller = Boolean(bestseller);
    }

    // Price range
    if (minPrice !== null || maxPrice !== null) {
      dbQuery.price = {};
      if (minPrice !== null && !isNaN(Number(minPrice))) dbQuery.price.$gte = Number(minPrice);
      if (maxPrice !== null && !isNaN(Number(maxPrice))) dbQuery.price.$lte = Number(maxPrice);
    }

    // Strictly fetch matching products from MongoDB database
    let candidateProducts = await productModel.find(dbQuery).lean();

    if (!candidateProducts || candidateProducts.length === 0) {
      return [];
    }

    // Post-filter: Strict Category Check
    if (targetCategory && targetCategory.trim()) {
      const catLower = targetCategory.trim().toLowerCase();
      candidateProducts = candidateProducts.filter(p => (p.category || '').toLowerCase() === catLower);
    }

    // Post-filter for Color
    if (color && color.trim()) {
      const colorLower = color.trim().toLowerCase();
      candidateProducts = candidateProducts.filter(p => {
        const pColors = Array.isArray(p.colors) ? p.colors.map(c => String(c).toLowerCase()) : [];
        const inColors = pColors.some(c => c.includes(colorLower));
        const inName = (p.name || '').toLowerCase().includes(colorLower);
        const inDesc = (p.description || '').toLowerCase().includes(colorLower);
        return inColors || inName || inDesc;
      });
    }

    // Post-filter for Size
    if (size && size.trim()) {
      const sizeUpper = size.trim().toUpperCase();
      candidateProducts = candidateProducts.filter(p => {
        const pSizes = Array.isArray(p.sizes) ? p.sizes.map(s => String(s).toUpperCase()) : [];
        return pSizes.includes(sizeUpper);
      });
    }

    // Intelligent Search Query Scoring (Filter noise words like 'me', 'aestic', 'for', 'need')
    if (query && query.trim()) {
      const stopWords = new Set(['for', 'me', 'i', 'need', 'want', 'show', 'aestic', 'aesthetic', 'aestid', 'with', 'the', 'and', 'or', 'in', 'under', 'below', 'tak', 'se', 'kam', 'ke', 'wala', 'wale', 'wali', 'dikhao', 'dikha', 'chahiye', 'please', 'can', 'you', 'give', 'is', 'it', 'clothes', 'clothing', 'item', 'items', 'best', 'latest', 'new', 'trending', 'top', 'rated', 'ka', 'ki', 'ko', 'hai', 'hain', 'mujhe', 'mera', 'meri']);
      const qTokens = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));
      
      if (qTokens.length > 0) {
        // Score products by how many key tokens match
        const scoredProducts = candidateProducts.map(p => {
          const pStr = `${p.name} ${p.category} ${p.subCategory} ${p.description || ''} ${p.brand || ''} ${p.fit || ''} ${p.occasion || ''}`.toLowerCase();
          let score = 0;
          qTokens.forEach(tok => {
            if (pStr.includes(tok)) score += 1;
            if ((p.name || '').toLowerCase().includes(tok)) score += 2;
          });
          return { product: p, score };
        });

        // Filter items that matched the tokens. We want to be strict to avoid returning noise.
        const maxScore = Math.max(...scoredProducts.map(i => i.score));
        
        // STRICTNESS: If the user provided multiple keywords, a score of 1 is too weak 
        // (likely just matched a color or single generic word). Reject it to trigger conversational fallback.
        if (qTokens.length > 1 && maxScore < 2) {
          candidateProducts = [];
        } else {
          // If maxScore is high, only keep the most relevant items (maxScore or maxScore - 1). If 1, keep 1.
          const minAcceptableScore = maxScore > 2 ? maxScore - 1 : maxScore;
          const matchedScored = scoredProducts.filter(item => item.score >= minAcceptableScore && item.score > 0);
          if (matchedScored.length > 0) {
            matchedScored.sort((a, b) => b.score - a.score);
            candidateProducts = matchedScored.map(item => item.product);
          } else {
            candidateProducts = [];
          }
        }
      }
    }

    return candidateProducts.slice(0, limit);
  } catch (error) {
    console.error('searchProducts MongoDB error:', error.message);
    throw error;
  }
};

/**
 * 2. Fallback Search - Relax criteria against MongoDB when exact search yields 0 items
 * STRICT RULE: NEVER relax or remove the user's requested category!
 */
export const fallbackSearchProducts = async (originalCriteria = {}) => {
  try {
    const relaxedNotes = [];
    let results = [];

    // Attempt 1: Relax price constraint by 35% (keeping Category strict)
    if (originalCriteria.maxPrice) {
      const newMaxPrice = Math.round(originalCriteria.maxPrice * 1.35);
      const criteriaAttempt = { ...originalCriteria, maxPrice: newMaxPrice };
      results = await searchProducts(criteriaAttempt);
      if (results.length > 0) {
        relaxedNotes.push(`Slightly higher price range (up to ₹${newMaxPrice})`);
        return { products: results, relaxedNotes, explanation: `I couldn't find an exact match under ₹${originalCriteria.maxPrice}, but I found these options in ${originalCriteria.category || 'our catalogue'} slightly above that budget:` };
      }
    }

    // Attempt 2: Relax fit/style constraint (keeping Category strict)
    if (originalCriteria.fit) {
      const criteriaAttempt = { ...originalCriteria, fit: '', maxPrice: originalCriteria.maxPrice ? originalCriteria.maxPrice * 1.25 : null };
      results = await searchProducts(criteriaAttempt);
      if (results.length > 0) {
        relaxedNotes.push(`Other fits`);
        return { products: results, relaxedNotes, explanation: `I couldn't find exact ${originalCriteria.fit} fit items in ${originalCriteria.category || 'our catalogue'}, but here are similar available styles:` };
      }
    }

    // Attempt 3: Relax strict color match (keeping Category strict)
    if (originalCriteria.color) {
      const criteriaAttempt = { ...originalCriteria, color: '' };
      results = await searchProducts(criteriaAttempt);
      if (results.length > 0) {
        relaxedNotes.push(`Other popular colors`);
        return { products: results, relaxedNotes, explanation: `We don't have that exact item in ${originalCriteria.color} in ${originalCriteria.category || 'our catalogue'}, but here are available options:` };
      }
    }

    // Attempt 4: Search general category in MongoDB (keeping Category strict!)
    if (originalCriteria.category || originalCriteria.subCategory) {
      const generalAttempt = {
        category: originalCriteria.category,
        subCategory: originalCriteria.subCategory,
        limit: 4
      };
      results = await searchProducts(generalAttempt);
      if (results.length > 0) {
        return { products: results, relaxedNotes: ['Category items'], explanation: `I couldn't find exact keyword matches, but here are popular items from our ${originalCriteria.category || originalCriteria.subCategory} collection:` };
      }
    }

    // Return empty results if category has no matching items
    return { products: [], relaxedNotes: [], explanation: `No matching ${originalCriteria.category ? originalCriteria.category + ' ' : ''}products found in our current store catalogue.` };
  } catch (error) {
    console.error('fallbackSearchProducts error:', error.message);
    return { products: [], relaxedNotes: [], explanation: 'No matching products found in our current store catalogue.' };
  }
};

/**
 * 3. Product Details Retrieval from MongoDB
 */
export const getProductDetails = async (productIdOrQuery, recentProducts = []) => {
  try {
    let product = null;

    if (productIdOrQuery) {
      if (String(productIdOrQuery).match(/^[0-9a-fA-F]{24}$/)) {
        product = await productModel.findById(productIdOrQuery).lean();
      }
      if (!product) {
        product = resolveProductFromContext(productIdOrQuery, recentProducts);
      }
    }

    if (!product && recentProducts.length > 0) {
      product = recentProducts[0];
    }

    if (!product) {
      return { success: false, message: 'I couldn\'t find that product in our current store catalogue.' };
    }

    return {
      success: true,
      product,
      details: {
        id: product._id,
        name: product.name,
        price: product.price,
        discount: product.discount || 0,
        description: product.description,
        sizes: product.sizes || [],
        colors: product.colors || [],
        material: product.material || product.fabric || 'That specification isn\'t available in our product data.',
        brand: product.brand || 'Veloura',
        fit: product.fit || 'Regular',
        rating: product.averageRating ? `⭐ ${product.averageRating} (${product.totalReviews || 0} reviews)` : 'Not rated yet',
        returnPolicy: product.returnAvailable ? '7-Day Return Available' : 'Non-returnable',
        cod: product.cashOnDelivery ? 'Cash on Delivery Available' : 'Prepaid Only',
        images: product.image || []
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * 4. Product Comparison Engine
 */
export const compareProducts = async (productRefs = [], recentProducts = []) => {
  try {
    let targetProducts = [];

    if (Array.isArray(productRefs) && productRefs.length > 0) {
      for (const ref of productRefs) {
        const found = resolveProductFromContext(ref, recentProducts);
        if (found && !targetProducts.some(p => p._id.toString() === found._id.toString())) {
          targetProducts.push(found);
        }
      }
    }

    if (targetProducts.length < 2 && recentProducts.length >= 2) {
      targetProducts = recentProducts.slice(0, 2);
    }

    if (targetProducts.length < 2) {
      return { success: false, message: 'Please specify at least two products from our catalogue to compare.' };
    }

    const comparisons = targetProducts.map(p => ({
      id: p._id,
      name: p.name,
      price: `₹${p.price}`,
      discount: p.discount ? `${p.discount}% OFF` : 'No discount',
      rating: p.averageRating ? `⭐ ${p.averageRating}/5` : 'N/A',
      material: p.material || p.fabric || 'That specification isn\'t available in our product data.',
      fit: p.fit || 'Standard',
      availableSizes: (p.sizes || []).join(', ') || 'N/A',
      colors: (p.colors || []).join(', ') || 'N/A',
      bestseller: p.bestseller ? 'Yes 🔥' : 'No',
      returnPolicy: p.returnAvailable ? '7 Days' : 'No'
    }));

    return {
      success: true,
      products: targetProducts,
      comparisonTable: comparisons
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * 5. Head-to-Toe AI Personal Stylist Recommendation Engine Grounded in MongoDB
 * Curates 4-piece outfits: Shirt/Topwear + Pants/Bottomwear + Shoes/Footwear + Accessories/Jewellery
 * Based on Age, Occasion, Body Type/Fit Preference, and Budget
 */
export const getFashionStylingOutfit = async (category = 'Men', occasion = 'casual', fitPreference = '', ageGroup = '', maxBudget = 5000) => {
  try {
    const budget = Number(maxBudget) || 5000;
    const catFilter = category ? { category: { $regex: new RegExp(`^${category}$`, 'i') } } : {};

    // 1. Fetch Topwear (Shirt / T-Shirt / Top)
    let topwearQuery = { ...catFilter, subCategory: { $regex: /topwear|shirt|t-shirt|top/i } };
    let topwearItems = await productModel.find(topwearQuery).lean();
    if (topwearItems.length === 0) topwearItems = await productModel.find({ subCategory: { $regex: /topwear|shirt|t-shirt|top/i } }).lean();

    // 2. Fetch Bottomwear (Pants / Jeans / Trousers)
    let bottomwearQuery = { ...catFilter, subCategory: { $regex: /bottomwear|pant|jeans|trouser|skirt/i } };
    let bottomwearItems = await productModel.find(bottomwearQuery).lean();
    if (bottomwearItems.length === 0) bottomwearItems = await productModel.find({ subCategory: { $regex: /bottomwear|pant|jeans|trouser/i } }).lean();

    // 3. Fetch Footwear (Shoes / Sneakers / Boots)
    let footwearQuery = { ...catFilter, subCategory: { $regex: /footwear|shoe|sneaker|boot/i } };
    let footwearItems = await productModel.find(footwearQuery).lean();
    if (footwearItems.length === 0) footwearItems = await productModel.find({ subCategory: { $regex: /footwear|shoe|sneaker|boot/i } }).lean();

    // 4. Fetch Accessories / Jewellery
    let accessoryQuery = { ...catFilter, subCategory: { $regex: /accessories|jewellery|watch|sunglasses|belt/i } };
    let accessoryItems = await productModel.find(accessoryQuery).lean();
    if (accessoryItems.length === 0) accessoryItems = await productModel.find({ subCategory: { $regex: /accessories|jewellery|watch|sunglasses/i } }).lean();

    if (!topwearItems.length || !bottomwearItems.length) {
      return { success: false, items: [], message: 'We don\'t have matching outfit items in our current store catalogue right now.' };
    }

    // Filter fit preference if specified
    if (fitPreference) {
      const fitLower = fitPreference.toLowerCase();
      const filteredTops = topwearItems.filter(p => (p.fit || '').toLowerCase().includes(fitLower) || (p.name || '').toLowerCase().includes(fitLower));
      if (filteredTops.length > 0) topwearItems = filteredTops;
    }

    // Find best 4-piece outfit combination (or 3-piece / 2-piece fallback) within budget
    let bestOutfit = null;
    let maxCombinedPrice = 0;

    // 4-Piece Combination Search
    if (footwearItems.length > 0 && accessoryItems.length > 0) {
      for (const top of topwearItems) {
        for (const bottom of bottomwearItems) {
          for (const shoe of footwearItems) {
            for (const acc of accessoryItems) {
              const ids = new Set([top._id.toString(), bottom._id.toString(), shoe._id.toString(), acc._id.toString()]);
              if (ids.size < 4) continue;
              const sumPrice = top.price + bottom.price + shoe.price + acc.price;
              if (sumPrice <= budget && sumPrice > maxCombinedPrice) {
                maxCombinedPrice = sumPrice;
                bestOutfit = [top, bottom, shoe, acc];
              }
            }
          }
        }
      }
    }

    // Fallback: 3-piece combination (Top + Bottom + Shoe or Accessory)
    if (!bestOutfit && footwearItems.length > 0) {
      for (const top of topwearItems) {
        for (const bottom of bottomwearItems) {
          for (const shoe of footwearItems) {
            const sumPrice = top.price + bottom.price + shoe.price;
            if (sumPrice <= budget && sumPrice > maxCombinedPrice) {
              maxCombinedPrice = sumPrice;
              bestOutfit = [top, bottom, shoe];
            }
          }
        }
      }
    }

    // Fallback: 2-piece combination (Top + Bottom)
    if (!bestOutfit) {
      for (const top of topwearItems) {
        for (const bottom of bottomwearItems) {
          const sumPrice = top.price + bottom.price;
          if (sumPrice <= budget && sumPrice > maxCombinedPrice) {
            maxCombinedPrice = sumPrice;
            bestOutfit = [top, bottom];
          }
        }
      }
    }

    if (!bestOutfit) {
      return { success: false, items: [], message: `I couldn't find a complete outfit under ₹${budget} in our current catalogue.` };
    }

    // Build personalized fashion advice based on Age, Occasion & Fit
    let advice = `Tailored for ${ageGroup || 'your style'}, ${occasion} vibe`;
    if (fitPreference) advice += ` with ${fitPreference} fit preference`;
    advice += `. Clean color harmony with premium comfort.`;

    return {
      success: true,
      category,
      occasion,
      fitPreference,
      ageGroup,
      totalPrice: maxCombinedPrice,
      maxBudget: budget,
      items: bestOutfit,
      stylingAdvice: advice,
      explanation: `Here is a complete Head-to-Toe AI Styled Outfit (${bestOutfit.length} items: Shirt + Pants${bestOutfit.length >= 3 ? ' + Shoes' : ''}${bestOutfit.length >= 4 ? ' + Accessory' : ''}) under ₹${budget} (Total: ₹${maxCombinedPrice}):`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Batch Cart Tool: Add Multiple Outfit Products to Cart in a Single Action
 */
export const addMultipleToCartTool = async (userId, itemsToAdd = [], recentProducts = []) => {
  try {
    let productsToProcess = [];
    if (Array.isArray(itemsToAdd) && itemsToAdd.length > 0) {
      productsToProcess = itemsToAdd;
    } else if (recentProducts && recentProducts.length > 0) {
      productsToProcess = recentProducts;
    }

    if (!productsToProcess || productsToProcess.length === 0) {
      return { success: false, message: 'No recommended outfit items found to add to your cart. Please ask for an outfit recommendation first!' };
    }

    const addedItemsInfo = [];
    let cartData = {};

    if (userId) {
      const userData = await userModel.findById(userId);
      if (userData) {
        cartData = userData.cartData || {};
      }
    }

    for (const item of productsToProcess) {
      const pidStr = item._id ? item._id.toString() : (item.id ? String(item.id) : null);
      if (!pidStr) continue;

      const dbCheck = await productModel.findById(pidStr).lean();
      if (!dbCheck) continue;

      // Do NOT ask for size first; use default size from product variant or 'M'
      const size = (dbCheck.sizes && dbCheck.sizes.length > 0) ? dbCheck.sizes[0] : 'M';
      if (userId) {
        if (cartData[pidStr]) {
          if (cartData[pidStr][size]) cartData[pidStr][size] += 1;
          else cartData[pidStr][size] = 1;
        } else {
          cartData[pidStr] = { [size]: 1 };
        }
      }
      addedItemsInfo.push({ id: pidStr, name: dbCheck.name, size, price: dbCheck.price, itemObj: dbCheck });
    }

    if (userId && Object.keys(cartData).length > 0) {
      await userModel.findByIdAndUpdate(userId, { cartData });
    }

    return {
      success: true,
      addedCount: addedItemsInfo.length,
      addedProducts: addedItemsInfo.map(i => i.itemObj),
      cartData,
      message: `✅ Complete outfit (${addedItemsInfo.length} items) added to cart!`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * 6. Real Cart Operations Tool with Strict MongoDB Product ID Validation
 */
export const addToCartTool = async (userId, productIdOrRef, size, quantity = 1, recentProducts = []) => {
  try {
    if (!userId) {
      return { success: false, requiresAuth: true, message: 'Please log in to add items to your shopping cart.' };
    }

    const product = resolveProductFromContext(productIdOrRef, recentProducts);
    if (!product || !product._id) {
      return { success: false, message: 'Could not identify a valid product from our catalogue to add to cart.' };
    }

    // Verify product actually exists in live MongoDB database
    const dbCheck = await productModel.findById(product._id).lean();
    if (!dbCheck) {
      return { success: false, message: 'This product does not exist in our store catalogue.' };
    }

    const availableSizes = dbCheck.sizes || [];
    let selectedSize = size ? String(size).toUpperCase() : null;

    if (!selectedSize) {
      selectedSize = (availableSizes.length > 0) ? availableSizes[0] : 'M';
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return { success: false, message: 'User account not found.' };
    }

    let cartData = userData.cartData || {};
    const pidStr = dbCheck._id.toString();

    if (cartData[pidStr]) {
      if (cartData[pidStr][selectedSize]) {
        cartData[pidStr][selectedSize] += Number(quantity);
      } else {
        cartData[pidStr][selectedSize] = Number(quantity);
      }
    } else {
      cartData[pidStr] = {};
      cartData[pidStr][selectedSize] = Number(quantity);
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    return {
      success: true,
      productId: dbCheck._id,
      productName: dbCheck.name,
      size: selectedSize,
      quantity,
      cartData,
      message: `Successfully added ${dbCheck.name} (Size: ${selectedSize}) to your cart! 🛒`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const removeFromCartTool = async (userId, productIdOrRef, size, recentProducts = []) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to modify your cart.' };

    const product = resolveProductFromContext(productIdOrRef, recentProducts);
    if (!product || !product._id) return { success: false, message: 'Could not find the product in your cart.' };

    const userData = await userModel.findById(userId);
    if (!userData) return { success: false, message: 'User account not found.' };

    let cartData = userData.cartData || {};
    const pidStr = product._id.toString();

    if (cartData[pidStr]) {
      if (size && cartData[pidStr][size.toUpperCase()]) {
        delete cartData[pidStr][size.toUpperCase()];
      } else {
        delete cartData[pidStr];
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    return {
      success: true,
      productName: product.name,
      cartData,
      message: `Removed ${product.name} from your cart.`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCartTool = async (userId) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to view your shopping cart.' };

    const userData = await userModel.findById(userId).lean();
    if (!userData) return { success: false, message: 'User not found.' };

    const rawCart = userData.cartData || {};
    const items = [];
    let grandTotal = 0;

    for (const pid in rawCart) {
      if (String(pid).match(/^[0-9a-fA-F]{24}$/)) {
        const pInfo = await productModel.findById(pid).lean();
        if (pInfo) {
          for (const s in rawCart[pid]) {
            const qty = rawCart[pid][s];
            if (qty > 0) {
              const itemTotal = pInfo.price * qty;
              grandTotal += itemTotal;
              items.push({
                product: pInfo,
                size: s,
                quantity: qty,
                itemTotal
              });
            }
          }
        }
      }
    }

    return {
      success: true,
      items,
      totalAmount: grandTotal,
      cartData: rawCart,
      message: items.length > 0 ? `Your cart has ${items.length} item(s) totaling ₹${grandTotal}.` : 'Your cart is currently empty.'
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * 7. Real Wishlist Tools Grounded in MongoDB userModel & productModel
 */

export const addToWishlistTool = async (userId, productIdOrRef, recentProducts = []) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to save items to your wishlist.' };

    const product = resolveProductFromContext(productIdOrRef, recentProducts);
    if (!product || !product._id) return { success: false, message: 'Could not identify a valid product from our catalogue to add to your wishlist.' };

    const dbCheck = await productModel.findById(product._id).lean();
    if (!dbCheck) return { success: false, message: 'This product does not exist in our store catalogue.' };

    const userData = await userModel.findById(userId);
    if (!userData) return { success: false, message: 'User account not found.' };

    let wishlist = userData.wishlist || [];
    const pidStr = dbCheck._id.toString();

    if (wishlist.includes(pidStr)) {
      return {
        success: true,
        product: dbCheck,
        wishlist,
        message: `${dbCheck.name} is already saved in your wishlist! ❤️`
      };
    }

    wishlist.push(pidStr);
    await userModel.findByIdAndUpdate(userId, { wishlist });

    return {
      success: true,
      product: dbCheck,
      wishlist,
      message: `Successfully saved ${dbCheck.name} to your wishlist! ❤️`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const removeFromWishlistTool = async (userId, productIdOrRef, recentProducts = []) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to modify your wishlist.' };

    const product = resolveProductFromContext(productIdOrRef, recentProducts);
    if (!product || !product._id) return { success: false, message: 'Could not find that product in your wishlist.' };

    const userData = await userModel.findById(userId);
    if (!userData) return { success: false, message: 'User account not found.' };

    let wishlist = userData.wishlist || [];
    const pidStr = product._id.toString();

    wishlist = wishlist.filter(id => id !== pidStr);
    await userModel.findByIdAndUpdate(userId, { wishlist });

    return {
      success: true,
      product,
      wishlist,
      message: `Removed ${product.name} from your wishlist.`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const toggleWishlistTool = async (userId, productIdOrRef, recentProducts = []) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to update your wishlist.' };

    const product = resolveProductFromContext(productIdOrRef, recentProducts);
    if (!product || !product._id) return { success: false, message: 'Could not identify product for wishlist.' };

    const userData = await userModel.findById(userId);
    if (!userData) return { success: false, message: 'User account not found.' };

    let wishlist = userData.wishlist || [];
    const pidStr = product._id.toString();

    if (wishlist.includes(pidStr)) {
      wishlist = wishlist.filter(id => id !== pidStr);
      await userModel.findByIdAndUpdate(userId, { wishlist });
      return { success: true, product, wishlist, action: 'REMOVED', message: `Removed ${product.name} from your wishlist.` };
    } else {
      wishlist.push(pidStr);
      await userModel.findByIdAndUpdate(userId, { wishlist });
      return { success: true, product, wishlist, action: 'ADDED', message: `Saved ${product.name} to your wishlist! ❤️` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getWishlistTool = async (userId) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to view your wishlist.' };

    const userData = await userModel.findById(userId).lean();
    if (!userData) return { success: false, message: 'User account not found.' };

    const rawWishlist = userData.wishlist || [];
    if (rawWishlist.length === 0) {
      return { success: true, items: [], message: 'Your wishlist is currently empty. Browse our store to save items you love!' };
    }

    const validIds = rawWishlist.filter(id => String(id).match(/^[0-9a-fA-F]{24}$/));
    const items = await productModel.find({ _id: { $in: validIds } }).lean();

    if (items.length === 0) {
      return { success: true, items: [], message: 'Your wishlist is currently empty.' };
    }

    return {
      success: true,
      items,
      message: `You have ${items.length} product(s) in your wishlist:`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const compareWishlistProductsTool = async (userId) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to compare your wishlist products.' };

    const wishlistRes = await getWishlistTool(userId);
    if (!wishlistRes.success || wishlistRes.items.length === 0) {
      return { success: false, message: 'Your wishlist is currently empty. Add at least two products to your wishlist to compare them!' };
    }

    const items = wishlistRes.items;
    if (items.length < 2) {
      return { success: false, message: `You currently have only 1 item (${items[0].name}) in your wishlist. Add at least one more item to your wishlist to compare!` };
    }

    const comparisons = items.map(p => ({
      id: p._id,
      name: p.name,
      price: `₹${p.price}`,
      discount: p.discount ? `${p.discount}% OFF` : 'No discount',
      rating: p.averageRating ? `⭐ ${p.averageRating}/5` : 'N/A',
      material: p.material || p.fabric || 'That specification isn\'t available in our product data.',
      fit: p.fit || 'Standard',
      bestseller: p.bestseller ? 'Yes 🔥' : 'No'
    }));

    return {
      success: true,
      products: items,
      comparisonTable: comparisons,
      message: `Here is a side-by-side comparison of the ${items.length} products in your wishlist:`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getBestWishlistProductTool = async (userId) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to evaluate your wishlist.' };

    const wishlistRes = await getWishlistTool(userId);
    if (!wishlistRes.success || wishlistRes.items.length === 0) {
      return { success: false, message: 'Your wishlist is currently empty. Save some products to your wishlist first!' };
    }

    const items = wishlistRes.items;
    if (items.length === 1) {
      return {
        success: true,
        bestProduct: items[0],
        products: items,
        message: `You currently have 1 item in your wishlist: **${items[0].name}** (₹${items[0].price}). It has a rating of ⭐ ${items[0].averageRating || 4.5}/5!`
      };
    }

    // Sort items by rating and bestseller status
    const sorted = [...items].sort((a, b) => {
      const scoreA = (a.averageRating || 0) * 10 + (a.bestseller ? 5 : 0) + (a.discount || 0) * 0.1;
      const scoreB = (b.averageRating || 0) * 10 + (b.bestseller ? 5 : 0) + (b.discount || 0) * 0.1;
      return scoreB - scoreA;
    });

    const best = sorted[0];
    return {
      success: true,
      bestProduct: best,
      products: [best],
      message: `Based on customer ratings (⭐ ${best.averageRating || 4.5}) and features, the top-rated item in your wishlist is **${best.name}** (₹${best.price})!`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * 8. Real Order Status Tool
 */
export const getOrderStatusTool = async (userId, orderId = null) => {
  try {
    if (!userId) return { success: false, requiresAuth: true, message: 'Please log in to check your order status.' };

    let query = { userId };
    if (orderId && String(orderId).match(/^[0-9a-fA-F]{24}$/)) {
      query._id = orderId;
    }

    const orders = await orderModel.find(query).sort({ date: -1 }).lean();

    if (orders.length === 0) {
      return { success: true, orders: [], message: 'You have no recent orders placed with us.' };
    }

    const latest = orders[0];
    return {
      success: true,
      orders,
      latestOrder: {
        id: latest._id,
        status: latest.status,
        amount: latest.amount,
        itemsCount: (latest.items || []).length,
        estimatedDelivery: latest.estimatedDelivery || '3 to 5 business days',
        date: new Date(latest.date).toLocaleDateString()
      },
      message: `Your latest order #${latest._id.toString().slice(-6)} is currently in status: "${latest.status}". Estimated delivery: ${latest.estimatedDelivery || '3-5 days'}.`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * 9. Price & Specs Comparison for a Specific Product vs Store Alternatives
 */
export const compareSingleProductPriceTool = async (productIdOrRef, recentProducts = []) => {
  try {
    let target = resolveProductFromContext(productIdOrRef, recentProducts);
    if (!target) {
      if (recentProducts.length > 0) target = recentProducts[0];
    }

    if (!target || !target._id) {
      return { success: false, message: 'Please select a valid product to compare prices.' };
    }

    const targetDb = await productModel.findById(target._id).lean();
    if (!targetDb) {
      return { success: false, message: 'This product does not exist in our current catalogue.' };
    }

    // Find comparable products in MongoDB in the same category/subCategory
    const comparable = await productModel.find({
      _id: { $ne: targetDb._id },
      category: targetDb.category,
      $or: [
        { subCategory: targetDb.subCategory },
        { name: { $regex: new RegExp(targetDb.subCategory || targetDb.name.split(' ')[0], 'i') } }
      ]
    }).limit(4).lean();

    const allProducts = [targetDb, ...comparable];

    // Build structured comparison details
    const comparisons = allProducts.map(p => {
      const priceDiff = p.price - targetDb.price;
      let priceNote = 'Base Item';
      if (p._id.toString() !== targetDb._id.toString()) {
        if (priceDiff < 0) priceNote = `₹${Math.abs(priceDiff)} CHEAPER 🏷️`;
        else if (priceDiff > 0) priceNote = `₹${priceDiff} HIGHER`;
        else priceNote = 'SAME PRICE';
      }

      return {
        id: p._id,
        name: p.name,
        image: Array.isArray(p.image) ? p.image[0] : p.image,
        price: p.price,
        discount: p.discount || 0,
        priceNote,
        category: p.category,
        subCategory: p.subCategory,
        rating: p.averageRating ? `⭐ ${p.averageRating}` : 'N/A',
        material: p.material || p.fabric || 'Cotton Blend',
        fit: p.fit || 'Regular',
        bestseller: Boolean(p.bestseller),
        isTarget: p._id.toString() === targetDb._id.toString()
      };
    });

    const cheaperOption = comparable.find(p => p.price < targetDb.price);
    let summaryMsg = `Comparing **${targetDb.name}** (₹${targetDb.price}) with similar ${targetDb.category} ${targetDb.subCategory} options in store:`;
    if (cheaperOption) {
      summaryMsg += `\n💡 **Better Price Found!** You can save ₹${targetDb.price - cheaperOption.price} with **${cheaperOption.name}** (₹${cheaperOption.price}).`;
    }

    return {
      success: true,
      targetProduct: targetDb,
      products: allProducts,
      comparisonList: comparisons,
      message: summaryMsg
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
