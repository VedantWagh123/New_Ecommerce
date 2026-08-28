import os
import sys
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from backend/.env
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)

MONGODB_URI = os.getenv("MONGODB_URI")
EMBEDDING_SERVICE_URL = os.getenv("EMBEDDING_SERVICE_URL", "http://127.0.0.1:8000")

if not MONGODB_URI:
    print("Error: MONGODB_URI not found in backend/.env")
    sys.exit(1)

print(f"Connecting to MongoDB...")
client = MongoClient(MONGODB_URI)
try:
    db = client.get_database() # Uses default db from URI if present
except Exception:
    db = client["e-commerce"] # Fallback to exactly what the backend uses
products_collection = db["products"]

# Get all products
total_products = products_collection.count_documents({})
print(f"Found {total_products} products in the database.")

products = products_collection.find({})

success_count = 0
fail_count = 0
skip_count = 0

for product in products:
    product_id = str(product.get("_id"))
    images = product.get("image", [])
    
    if not images or len(images) == 0:
        print(f"Skipping product {product_id} (No images)")
        skip_count += 1
        continue
        
    image_url = images[0]
    
    print(f"Indexing product {product_id}...")
    try:
        response = requests.post(f"{EMBEDDING_SERVICE_URL}/index", json={
            "product_id": product_id,
            "image_url": image_url
        }, timeout=20)
        
        if response.status_code == 200:
            success_count += 1
        else:
            print(f"Failed to index {product_id}: {response.text}")
            fail_count += 1
    except Exception as e:
        print(f"Error indexing {product_id}: {str(e)}")
        fail_count += 1

print("\n--- Backfill Complete ---")
print(f"Total Products: {total_products}")
print(f"Successfully Indexed: {success_count}")
print(f"Failed: {fail_count}")
print(f"Skipped (No image): {skip_count}")
