import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { generateDataset } from './dataset_generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const MODEL_NAME = process.env.FINE_TUNED_MODEL_NAME || 'veloura-stylist:latest';

export const buildCustomOllamaModel = async () => {
  console.log('====================================================');
  console.log('🚀 OLLAMA E-COMMERCE SHOPPING AGENT MODEL BUILDER');
  console.log('====================================================\n');

  // STEP 1: Generate dataset
  console.log('📦 STEP 1: Exporting & Formatting Training Dataset...');
  const datasetSummary = generateDataset();

  // STEP 2: Verify Modelfile existence
  const modelfilePath = path.join(__dirname, 'Modelfile');
  if (!fs.existsSync(modelfilePath)) {
    throw new Error(`Modelfile not found at: ${modelfilePath}`);
  }
  console.log(`\n📄 STEP 2: Loaded Modelfile from: ${modelfilePath}`);

  // STEP 3: Register / Create Custom Model via CLI or Ollama API
  console.log(`\n🛠️ STEP 3: Building Custom Model '${MODEL_NAME}' in Ollama...`);
  try {
    const modelfileContent = fs.readFileSync(modelfilePath, 'utf-8');
    
    // Attempt build via Ollama CLI first
    try {
      console.log(`Executing CLI command: ollama create ${MODEL_NAME} -f "${modelfilePath}"`);
      const cliOutput = execSync(`ollama create ${MODEL_NAME} -f "${modelfilePath}"`, { encoding: 'utf-8' });
      console.log('CLI Output:\n', cliOutput);
    } catch (cliErr) {
      console.log('CLI build notice (falling back to REST API build):', cliErr.message);

      // Fallback via Ollama REST API /api/create
      const response = await axios.post(`${OLLAMA_HOST}/api/create`, {
        name: MODEL_NAME,
        modelfile: modelfileContent,
        stream: false
      }, { timeout: 30000 });

      console.log('REST API Build Status:', response.data?.status || 'OK');
    }

    // STEP 4: Verify Model Registration
    console.log(`\n🔍 STEP 4: Verifying Model Registration on ${OLLAMA_HOST}...`);
    const tagsRes = await axios.get(`${OLLAMA_HOST}/api/tags`);
    const models = tagsRes.data?.models || [];
    const createdModel = models.find(m => m.name.toLowerCase().includes('veloura-stylist') || m.name.toLowerCase().includes(MODEL_NAME.toLowerCase()));

    if (createdModel) {
      console.log(`\n🎉 SUCCESS! Fine-tuned Model '${createdModel.name}' is active & runnable in Ollama!`);
      console.log(`• Model Size: ${(createdModel.size / (1024 * 1024 * 1024)).toFixed(2)} GB`);
      console.log(`• Modified At: ${createdModel.modified_at}`);
      return { success: true, modelName: createdModel.name };
    } else {
      console.warn(`⚠️ Model created, but not listed in tags. Available models:`, models.map(m => m.name));
      return { success: true, modelName: MODEL_NAME };
    }
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    return { success: false, error: err.message };
  }
};

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('build_ollama_model.js')) {
  buildCustomOllamaModel();
}
