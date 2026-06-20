"""Parse Pakistani mobile-wallet / bank transfer receipt OCR text."""

from __future__ import annotations

import re
from typing import Any

TXN_LABEL = re.compile(
    r"(?:transaction(?:\s*id)?|txn(?:\s*id)?|tid|reference(?:\s*no\.?)?|ref(?:\s*no\.?)?|trxn(?:\s*id)?)"
    r"[\s#:.\-]*([A-Z0-9]{6,24})",
    re.IGNORECASE,
)

STANDALONE_TXN = re.compile(r"\b([A-Z]{2,4}\d{8,16})\b")
NUMERIC_REF = re.compile(r"\b(\d{10,16})\b")

AMOUNT_PATTERNS = [
    re.compile(r"(?:amount|rs\.?|pkr)[\s:]*([\d,]+(?:\.\d{1,2})?)", re.IGNORECASE),
    re.compile(r"([\d,]+(?:\.\d{1,2})?)\s*(?:pkr|rs\.?)", re.IGNORECASE),
]

PAYMENT_HINTS: list[tuple[str, str]] = [
    ("jazzcash", "jazzcash"),
    ("easypaisa", "easypaisa"),
    ("meezan", "bank"),
    ("bank transfer", "bank"),
    ("iban", "bank"),
]


def _parse_amount(raw: str) -> float | None:
    cleaned = raw.replace(",", "").strip()
    try:
        value = float(cleaned)
    except ValueError:
        return None
    if 100 <= value <= 500_000:
        return value
    return None


def extract_transaction_id(text: str) -> str | None:
    for pattern in (TXN_LABEL, STANDALONE_TXN, NUMERIC_REF):
        match = pattern.search(text)
        if match:
            return match.group(1).upper()
    return None


def extract_amount(text: str) -> float | None:
    for pattern in AMOUNT_PATTERNS:
        match = pattern.search(text)
        if match:
            parsed = _parse_amount(match.group(1))
            if parsed is not None:
                return parsed
    return None


def detect_payment_method(text: str) -> str | None:
    lower = text.lower()
    for needle, method in PAYMENT_HINTS:
        if needle in lower:
            return method
    return None


def parse_receipt_text(text: str) -> dict[str, Any]:
    normalized = re.sub(r"\s+", " ", text).strip()
    return {
        "text": normalized,
        "transaction_id": extract_transaction_id(normalized),
        "extracted_amount": extract_amount(normalized),
        "payment_method": detect_payment_method(normalized),
    }
