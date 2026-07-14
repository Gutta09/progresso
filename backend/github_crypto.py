"""Symmetric encryption for GitHub personal access tokens at rest.

The Fernet key is derived from the app's existing SECRET_KEY, so no extra
environment variable is required. Raw tokens are never stored in the database
and never returned to the frontend.
"""
import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

load_dotenv()

_SECRET_KEY = os.getenv("SECRET_KEY")
if not _SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set to encrypt GitHub tokens")

# Fernet needs a 32-byte urlsafe-base64 key; derive one deterministically.
_FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(_SECRET_KEY.encode()).digest())
_fernet = Fernet(_FERNET_KEY)


def encrypt_token(plain: str) -> str:
    return _fernet.encrypt(plain.encode("utf-8")).decode("utf-8")


def decrypt_token(cipher: str) -> str:
    try:
        return _fernet.decrypt(cipher.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise RuntimeError("Stored GitHub token could not be decrypted") from exc
