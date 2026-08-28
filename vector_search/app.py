import os
import uuid
import base64
import io
import requests
from PIL import Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

app = FastAPI(title="Fashion Visual Search API")

# Initialize Model (CLIP)
MODEL_NAME = 'sentence-transformers/clip-ViT-B-32'
print(f"Loading model {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)
print("Model loaded.")

# Initialize Qdrant client (Cloud or Local)
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

if QDRANT_URL and QDRANT_API_KEY:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    print("Connected to Qdrant Cloud.")
else:
    QDRANT_PATH = "qdrant_data"
    client = QdrantClient(path=QDRANT_PATH)
    print("Connected to Local Qdrant.")

COLLECTION_NAME = "fashion_products"

# Ensure collection exists
collections = [c.name for c in client.get_collections().collections]
if COLLECTION_NAME not in collections:
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=512, distance=Distance.COSINE),
    )
    print(f"Collection '{COLLECTION_NAME}' created.")

# API Models
class IndexRequest(BaseModel):
    product_id: str
    image_url: str = None
    image_base64: str = None

class SearchRequest(BaseModel):
    image_url: str = None
    image_base64: str = None
    limit: int = 20

from PIL import Image, ImageStat

def get_image_from_request(url: str, b64: str) -> Image.Image:
    from PIL import UnidentifiedImageError
    img = None
    try:
        if b64:
            # Handle base64 string (might have data:image/jpeg;base64, prefix)
            if "," in b64:
                b64 = b64.split(",")[1]
            image_data = base64.b64decode(b64)
            img = Image.open(io.BytesIO(image_data)).convert("RGB")
        elif url:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            img = Image.open(io.BytesIO(response.content)).convert("RGB")
        else:
            raise ValueError("Either image_url or image_base64 must be provided.")
    except UnidentifiedImageError:
        raise ValueError("Invalid image file format or corrupted image.")
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to process image: {str(e)}")
    
    # Reject completely uniform or low-information images (e.g. pure black/white or very low contrast)
    stat = ImageStat.Stat(img.convert("L"))
    if stat.stddev[0] < 2.0: # Very low standard deviation = almost uniform color
        raise ValueError("Image has too little detail, contrast, or is uniformly colored.")
        
    return img

def get_product_uuid(product_id: str) -> str:
    # Qdrant requires UUID or integer for point IDs
    return str(uuid.uuid5(uuid.NAMESPACE_OID, product_id))

@app.post("/index")
async def index_product(req: IndexRequest):
    try:
        img = get_image_from_request(req.image_url, req.image_base64)
        # Generate embedding
        embedding = model.encode(img).tolist()
        
        point_id = get_product_uuid(req.product_id)
        
        # Store in Qdrant
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={"product_id": req.product_id}
                )
            ]
        )
        return {"success": True, "message": f"Product {req.product_id} indexed successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_similar(req: SearchRequest):
    try:
        img = get_image_from_request(req.image_url, req.image_base64)
        # Generate embedding
        embedding = model.encode(img).tolist()
        
        # Search Qdrant
        search_result = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=embedding,
            limit=req.limit
        )
        
        results = []
        for hit in search_result:
            results.append({
                "product_id": hit.payload.get("product_id"),
                "score": hit.score
            })
            
        return {"success": True, "results": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
