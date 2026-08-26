import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const BASE_MODEL = process.env.BASE_MODEL || 'llava:latest';
const FINE_TUNED_MODEL = process.env.FINE_TUNED_MODEL || 'veloura-stylist:latest';
const BACKEND_API = process.env.BACKEND_URL || 'http://localhost:5000/api/ai/chat';

const benchmarkPrompts = [
  {
    title: "Strict Men's Category Search",
    prompt: "black shirt for men aesthetic",
    expectedCategory: "Men",
    checkCategoryStrictness: true
  },
  {
    title: "Price & Budget Filter",
    prompt: "college outfit under 3000",
    expectedBudget: 3000,
    checkOutfit: true
  },
  {
    title: "Price & Specs Comparison",
    prompt: "compare price for pink shirt",
    checkComparison: true
  },
  {
    title: "Casual Stylist Conversation",
    prompt: "kaise ho bhai?",
    checkHinglish: true
  }
];

export const runModelEvaluation = async () => {
  console.log('====================================================');
  console.log('📊 OLLAMA MODEL BENCHMARK & EVALUATION TEST SUITE');
  console.log('====================================================\n');
  console.log(`• Base Model:       ${BASE_MODEL}`);
  console.log(`• Fine-Tuned Model: ${FINE_TUNED_MODEL}`);
  console.log(`• Backend Endpoint: ${BACKEND_API}\n`);

  const results = [];

  for (const test of benchmarkPrompts) {
    console.log(`\n----------------------------------------------------`);
    console.log(`🧪 TEST: ${test.title}`);
    console.log(`💬 Prompt: "${test.prompt}"`);

    // 1. Evaluate Base Model / Default API
    const startBase = Date.now();
    let baseRes = null;
    try {
      const res = await axios.post(BACKEND_API, {
        prompt: test.prompt,
        overrideModel: BASE_MODEL
      }, { timeout: 15000 });
      baseRes = res.data;
    } catch (e) {
      baseRes = { success: false, reply: e.message };
    }
    const durationBase = Date.now() - startBase;

    // 2. Evaluate Fine-Tuned Model API
    const startFt = Date.now();
    let ftRes = null;
    try {
      const res = await axios.post(BACKEND_API, {
        prompt: test.prompt,
        overrideModel: FINE_TUNED_MODEL
      }, { timeout: 15000 });
      ftRes = res.data;
    } catch (e) {
      ftRes = { success: false, reply: e.message };
    }
    const durationFt = Date.now() - startFt;

    // Check category strictness
    const baseCatMatches = (baseRes.recommendedProducts || []).map(p => p.category);
    const ftCatMatches = (ftRes.recommendedProducts || []).map(p => p.category);

    const testSummary = {
      test: test.title,
      prompt: test.prompt,
      baseModel: {
        latencyMs: durationBase,
        matchesCount: (baseRes.recommendedProducts || []).length,
        categoriesReturned: baseCatMatches,
        replySnippet: (baseRes.reply || '').slice(0, 100)
      },
      fineTunedModel: {
        latencyMs: durationFt,
        matchesCount: (ftRes.recommendedProducts || []).length,
        categoriesReturned: ftCatMatches,
        replySnippet: (ftRes.reply || '').slice(0, 100),
        comparisonProvided: Boolean(ftRes.comparisonList)
      }
    };

    results.push(testSummary);

    console.log(`⏱️ Base Model Latency:       ${durationBase} ms`);
    console.log(`⏱️ Fine-Tuned Model Latency: ${durationFt} ms`);
    console.log(`🎯 Base Returned Categories:       [${baseCatMatches.join(', ')}]`);
    console.log(`🎯 Fine-Tuned Returned Categories: [${ftCatMatches.join(', ')}]`);
  }

  // Save Benchmark Report
  const reportPath = path.join(__dirname, 'data', 'benchmark_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ evaluatedAt: new Date().toISOString(), results }, null, 2), 'utf-8');

  console.log(`\n====================================================`);
  console.log(`✅ Evaluation Complete! Benchmark report saved to: ${reportPath}`);
  console.log(`====================================================\n`);

  return results;
};

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('evaluate_models.js')) {
  runModelEvaluation();
}
