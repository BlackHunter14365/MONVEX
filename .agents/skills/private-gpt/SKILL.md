---
name: private-gpt
description: >-
  Build, deploy, and integrate 100% private, offline, and local document Q&A and RAG
  (Retrieval-Augmented Generation) systems using PrivateGPT (PGPT). Use when you need
  to ingest sensitive financial documents (bank statements, tax records, invoice PDFs,
  CSV transaction ledgers), generate local vector embeddings with ChromaDB/PGVector/Qdrant,
  and query them using local offline LLMs (via Ollama, LlamaCPP, or vLLM) with ZERO data leakage.
---

# PrivateGPT (PGPT) Agent Skill

A comprehensive production guide for deploying and integrating **PrivateGPT** for private, local, zero-data-leakage Document Ingestion, Hybrid Vector Retrieval (RAG), and Contextual LLM Question Answering.

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │        Private Document Sources        │
                      │ (Bank Statements, PDFs, CSVs, Invoices)│
                      └───────────────────┬────────────────────┘
                                          │
                                   [ Document Parser ]
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    Local Embedding Model (Ollama/BGE)  │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │  Local Vector DB (ChromaDB / Qdrant)   │
                      └───────────────────┬────────────────────┘
                                          │
                        [ Hybrid Search / Dense + Sparse ]
                                          │
                                          ▼
┌───────────────────────────┐   ┌────────────────────────────────────────┐
│  User Financial Question  ├──►│   Context-Augmented Local LLM Engine   │
│ ("Analyze Q2 tax report") │   │      (Llama 3 / Mistral / Gemma)       │
└───────────────────────────┘   └───────────────────┬────────────────────┘
                                                    │
                                                    ▼
                                ┌────────────────────────────────────────┐
                                │     Private Grounded Answer + Source   │
                                └────────────────────────────────────────┘
```

---

## 2. Installation & Quick Setup

### Option A: Local Python / UV Execution

```bash
# 1. Clone PrivateGPT
git clone https://github.com/zylon-ai/private-gpt.git
cd private-gpt

# 2. Install dependencies via UV or Poetry
uv sync --extra ui --extra local

# 3. Setup Local LLM & Embeddings (Ollama or LlamaCPP)
# settings.yaml configuration:
# llm:
#   mode: ollama
#   ollama:
#     llm_model: llama3:8b
# embedding:
#   mode: ollama
#   ollama:
#     embedding_model: nomic-embed-text

# 4. Start PrivateGPT server (FastAPI on port 8001)
python -m private_gpt
```

### Option B: Docker Container Deployment

```bash
# Run with Local Ollama integration
docker run -d \
  -p 8001:8001 \
  -v $(pwd)/local_data:/app/local_data \
  -e PGPT_PROFILES=ollama \
  zylon-ai/private-gpt:latest
```

---

## 3. Core API Endpoints & Python Client Integration

### 1. Ingest Private Financial Documents (`/v1/ingest/file`)

```python
import httpx

PGPT_URL = "http://localhost:8001/v1"

async def ingest_financial_document(file_path: str):
    """
    Uploads a bank statement, tax invoice, or financial report
    to the local PrivateGPT vector store.
    """
    async with httpx.AsyncClient() as client:
        with open(file_path, "rb") as f:
            files = {"file": f}
            res = await client.post(f"{PGPT_URL}/ingest/file", files=files)
            res.raise_for_status()
            doc_data = res.json()
            # Returns ingested document ID and chunk count
            return doc_data
```

### 2. Contextual RAG Chat Query (`/v1/chat/completions`)

```python
async def query_private_financial_rag(question: str, doc_ids: list = None):
    """
    Queries local LLM with grounded chunks from ingested documents.
    """
    payload = {
        "messages": [
            {"role": "system", "content": "You are a private financial analyst. Answer questions strictly using the provided document context."},
            {"role": "user", "content": question}
        ],
        "use_context": True,
        "context_filter": {"docs_ids": doc_ids} if doc_ids else None,
        "stream": False
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(f"{PGPT_URL}/chat/completions", json=payload)
        res.raise_for_status()
        data = res.json()
        return {
            "answer": data["choices"][0]["message"]["content"],
            "sources": data.get("sources", [])
        }
```

---

## 4. Best Practices for Financial RAG & Sensitive Data

1. **Zero External Network Calls**:
   - Ensure `mode: local` or `mode: ollama` in `settings.yaml` to prevent any chunk or prompt from leaving the host machine.
2. **Chunking Strategy for Financial Tables**:
   - Set chunk size to `512` or `1024` tokens with `100` token overlap.
   - For structured tabular statements (CSV/XLSX), parse rows into atomic key-value sentences before embedding.
3. **Hybrid Search (Dense Semantic + Keyword BM25)**:
   - Financial numbers, transaction IDs, and merchant names require exact keyword matching alongside vector similarity.
4. **Source Attribution & Audit Trails**:
   - Always return exact page numbers, chunk IDs, and bounding boxes for extracted financial metrics.
