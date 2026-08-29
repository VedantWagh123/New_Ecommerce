import os
import uuid
import base64
import io
import requests
from PIL import Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torchvision.models as models
import torchvision.transforms as transforms
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

app = FastAPI(title="Fashion Visual Search API")

import torch
# Optimize PyTorch memory for 512MB RAM constraints (Render Free Tier)
os.environ["MALLOC_ARENA_MAX"] = "2"
os.environ["OMP_NUM_THREADS"] = "1"
torch.set_num_threads(1)
torch.set_grad_enabled(False) # Disable gradients globally to save memory

# Initialize Model (ResNet18)
print("Loading ResNet18 model (optimized for low memory)...")
model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
model.fc = torch.nn.Identity() # Remove classification layer to get 512-dim embedding
model.eval() # Set to evaluation mode
print("Model loaded.")

# Image preprocessing for ResNet18
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def generate_embedding(img: Image.Image) -> list:
    input_tensor = preprocess(img).unsqueeze(0)
    with torch.inference_mode():
        embedding = model(input_tensor).squeeze(0).tolist()
    return embedding

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
        embedding = generate_embedding(img)
        
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
        embedding = generate_embedding(img)
        
        # Search Qdrant
        search_result = client.query_points(
            collection_name=COLLECTION_NAME,
            query=embedding,
            limit=req.limit
        ).points
        
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
    # Make sure we use only 1 worker to save memory
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), workers=1)
