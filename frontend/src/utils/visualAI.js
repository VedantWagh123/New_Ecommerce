/**
 * Multi-Vector AI Feature Extractor & Catalog Similarity Engine
 * Evaluates color vectors, pattern/texture density, aspect ratio silhouette, and catalog keywords.
 */

// Downscale & extract feature vectors from an image data URL
export const extractImageFeatures = (dataUrl) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const SIZE = 128;
                canvas.width = SIZE;
                canvas.height = SIZE;
                ctx.drawImage(img, 0, 0, SIZE, SIZE);

                const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
                const data = imageData.data;
                const totalPixels = SIZE * SIZE;

                // 1. Color Histogram Vector (8 bins per RGB channel)
                const rBins = new Array(8).fill(0);
                const gBins = new Array(8).fill(0);
                const bBins = new Array(8).fill(0);

                let totalLum = 0;
                let lumSq = 0;

                // 2. Pattern & Edge Gradient Calculation
                let edgeSum = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Luminance
                    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                    totalLum += lum;
                    lumSq += lum * lum;

                    // Binning
                    const rIdx = Math.min(7, Math.floor(r / 32));
                    const gIdx = Math.min(7, Math.floor(g / 32));
                    const bIdx = Math.min(7, Math.floor(b / 32));

                    rBins[rIdx]++;
                    gBins[gIdx]++;
                    bBins[bIdx]++;
                }

                // Simple edge density calculation across pixels
                for (let y = 0; y < SIZE - 1; y += 2) {
                    for (let x = 0; x < SIZE - 1; x += 2) {
                        const idx1 = (y * SIZE + x) * 4;
                        const idx2 = (y * SIZE + (x + 1)) * 4;
                        const diff = Math.abs(data[idx1] - data[idx2]);
                        if (diff > 25) edgeSum++;
                    }
                }

                const meanLum = totalLum / totalPixels;
                const variance = Math.sqrt((lumSq / totalPixels) - (meanLum * meanLum));
                const patternDensity = edgeSum / (totalPixels / 4);
                const aspectRatio = img.naturalWidth / (img.naturalHeight || 1);

                // Normalize color vectors
                const colorVec = [
                    ...rBins.map(v => v / totalPixels),
                    ...gBins.map(v => v / totalPixels),
                    ...bBins.map(v => v / totalPixels)
                ];

                resolve({
                    valid: true,
                    variance,
                    aspectRatio,
                    patternDensity,
                    colorVec,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => {
            reject(new Error("Unable to decode image file."));
        };

        img.src = dataUrl;
    });
};

// Validate whether an image is usable and contains an identifiable subject
export const validateImageQuality = async (dataUrl) => {
    try {
        const features = await extractImageFeatures(dataUrl);
        // Standard deviation variance check (reject blank / single solid color backgrounds)
        if (features.variance < 10) {
            return {
                valid: false,
                reason: "We couldn't identify a product in this image. Please upload a clear photo of the clothing item."
            };
        }
        return { valid: true, features };
    } catch (err) {
        return {
            valid: false,
            reason: "The uploaded file could not be decoded. Please try another JPG, PNG, or WEBP image."
        };
    }
};

// Calculate visual similarity between two feature sets (0 - 100)
export const calculateVisualSimilarity = (userFeatures, prodFeatures) => {
    if (!userFeatures || !prodFeatures) return 0;

    // 1. Color Histogram Cosine Similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < userFeatures.colorVec.length; i++) {
        const a = userFeatures.colorVec[i] || 0;
        const b = prodFeatures.colorVec[i] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    }

    const colorSim = (normA && normB) ? (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))) * 100 : 0;

    // 2. Pattern Density Similarity
    const patternDiff = Math.abs(userFeatures.patternDensity - prodFeatures.patternDensity);
    const patternSim = Math.max(0, 100 - (patternDiff * 150));

    // 3. Aspect Ratio Silhouette Similarity
    const aspectDiff = Math.abs(userFeatures.aspectRatio - prodFeatures.aspectRatio);
    const aspectSim = Math.max(0, 100 - (aspectDiff * 50));

    // Weighted Combined Score
    const totalScore = (colorSim * 0.55) + (patternSim * 0.25) + (aspectSim * 0.20);
    return Math.round(totalScore);
};

// Match uploaded user image against existing products catalog with strict threshold filtering
export const matchCatalogProducts = async (userImageFeatures, catalogProducts, threshold = 55) => {
    if (!userImageFeatures || !catalogProducts || catalogProducts.length === 0) {
        return [];
    }

    const scoredProducts = await Promise.all(
        catalogProducts.map(async (product) => {
            const mainImg = product.image?.[0];
            if (!mainImg) return null;

            try {
                const prodFeatures = await extractImageFeatures(mainImg);
                let score = calculateVisualSimilarity(userImageFeatures, prodFeatures);

                // Silhouette aspect ratio check (penalty if aspect ratios strongly contradict)
                if (userImageFeatures.aspectRatio && prodFeatures.aspectRatio) {
                    const aspectDiff = Math.abs(userImageFeatures.aspectRatio - prodFeatures.aspectRatio);
                    if (aspectDiff > 0.4) score -= 15;
                }

                return {
                    product,
                    score
                };
            } catch (err) {
                return null;
            }
        })
    );

    const validScored = scoredProducts.filter(item => item !== null);

    // Strict threshold filtering: keep ONLY products that pass the similarity threshold
    const matchingProducts = validScored
        .filter(item => item.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);

    return matchingProducts;
};
