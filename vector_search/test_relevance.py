import os
import requests
import io
from PIL import Image
import numpy as np
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from dotenv import load_dotenv

# Load Env
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)

MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
try:
    db = client.get_database()
except:
    db = client["e-commerce"]
products = list(db["products"].find({"image": {"$exists": True, "$ne": []}}).limit(10))

# Load Model
MODEL_NAME = 'sentence-transformers/clip-ViT-B-32'
model = SentenceTransformer(MODEL_NAME)

def get_similarity(emb1, emb2):
    return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

# Cat image (unrelated)
cat_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg"
r = requests.get(cat_url)
cat_img = Image.open(io.BytesIO(r.content)).convert("RGB")
cat_emb = model.encode(cat_img)

# Product
r = requests.get(products[0]["image"][0])
img1 = Image.open(io.BytesIO(r.content)).convert("RGB")
img1_emb = model.encode(img1)

print("\n--- Similarity Scores ---")
print(f"Cat vs Product 1: {get_similarity(cat_emb, img1_emb):.4f}")
print(f"Cat vs Product 2: {get_similarity(cat_emb, model.encode(Image.open(io.BytesIO(requests.get(products[1]['image'][0]).content)).convert('RGB'))):.4f}")
print(f"Product 1 vs Product 2: {get_similarity(img1_emb, model.encode(Image.open(io.BytesIO(requests.get(products[1]['image'][0]).content)).convert('RGB'))):.4f}")
print(f"Product 1 vs Product 3: {get_similarity(img1_emb, model.encode(Image.open(io.BytesIO(requests.get(products[2]['image'][0]).content)).convert('RGB'))):.4f}")
