"""Donation receipt OCR — FastAPI service (Python + Tesseract)."""

from __future__ import annotations

import io
import os
from typing import Annotated

import pytesseract
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from extract import parse_receipt_text

API_KEY = os.environ.get("DONATION_OCR_API_KEY", "")
MAX_BYTES = 5 * 1024 * 1024
ALLOWED = {"image/jpeg", "image/png", "image/jpg"}

app = FastAPI(title="Codemo Donation OCR", version="1.0.0")


def verify_api_key(x_api_key: Annotated[str | None, Header()] = None) -> None:
    if not API_KEY:
        return
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ocr")
async def ocr_receipt(
    _: Annotated[None, Depends(verify_api_key)],
    file: UploadFile = File(...),
) -> dict:
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only PNG and JPEG images are supported")

    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5 MB or smaller")
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        image = Image.open(io.BytesIO(raw))
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        text = pytesseract.image_to_string(image)
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Could not read image") from exc
    except pytesseract.TesseractNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail="Tesseract is not installed. Install tesseract-ocr on the host.",
        ) from exc

    parsed = parse_receipt_text(text)
    return {
        "text": parsed["text"],
        "transaction_id": parsed["transaction_id"],
        "extracted_amount": parsed["extracted_amount"],
        "payment_method": parsed["payment_method"],
    }
