FROM python:3.9-slim

WORKDIR /code

# Copy requirements and install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# Copy application files
COPY . /code

# HuggingFace uses port 7860
ENV PORT=7860

# Give permissions (required by HF Spaces for local db storage if using Qdrant local)
RUN mkdir -p /code/qdrant_data && chmod 777 /code/qdrant_data

EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
