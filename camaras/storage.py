import os
import json
import requests
from typing import List, Optional
from io import BytesIO


def _headers(service_key: str) -> dict:
    return {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }


def ensure_bucket(bucket: str) -> None:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        return
    endpoint = f"{url}/storage/v1/bucket"
    body = {
        "name": bucket,
        "public": False,
        "file_size_limit": "50MB",
        "allowed_mime_types": [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
        ],
    }
    try:
        r = requests.post(endpoint, headers={**_headers(key), "Content-Type": "application/json"}, data=json.dumps(body), timeout=10)
        # 409 = ya existe, se ignora
        if r.status_code not in (200, 201, 409):
            print("[storage] No se pudo asegurar bucket:", r.status_code, r.text)
    except Exception as e:
        print("[storage] Excepción al asegurar bucket:", e)


def upload_file(bucket: str, remote_path: str, local_path: str, content_type: str) -> bool:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("[storage] SUPABASE_URL o SUPABASE_SERVICE_KEY no configurados.")
        return False


def list_files(bucket: str, prefix: str = "") -> List[str]:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        return []
    ensure_bucket(bucket)
    endpoint = f"{url}/storage/v1/object/list/{bucket}"
    body = {"prefix": prefix, "limit": 1000, "offset": 0, "sortBy": {"column": "name", "order": "desc"}}
    try:
        r = requests.post(endpoint, headers={**_headers(key), "Content-Type": "application/json"}, data=json.dumps(body), timeout=15)
        if 200 <= r.status_code < 300:
            entries = r.json()
            return [e.get("name") for e in entries if e.get("name")]
        else:
            print("[storage] Error listando:", r.status_code, r.text)
            return []
    except Exception as e:
        print("[storage] Excepción al listar:", e)
        return []


def get_signed_url(bucket: str, remote_path: str, expires_in: int = 3600) -> Optional[str]:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        return None
    endpoint = f"{url}/storage/v1/object/sign/{bucket}/{remote_path}"
    body = {"expiresIn": expires_in}
    try:
        r = requests.post(endpoint, headers={**_headers(key), "Content-Type": "application/json"}, data=json.dumps(body), timeout=10)
        if 200 <= r.status_code < 300:
            signed = r.json().get("signedURL")
            if signed:
                return f"{url}{signed}"
        else:
            print("[storage] Error creando signed URL:", r.status_code, r.text)
            return None
    except Exception as e:
        print("[storage] Excepción al firmar URL:", e)
        return None


def download_bytes(bucket: str, remote_path: str) -> Optional[bytes]:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        return None
    endpoint = f"{url}/storage/v1/object/{bucket}/{remote_path}"
    try:
        r = requests.get(endpoint, headers=_headers(key), timeout=30)
        if 200 <= r.status_code < 300:
            return r.content
        else:
            print("[storage] Error descargando:", r.status_code, r.text)
            return None
    except Exception as e:
        print("[storage] Excepción al descargar:", e)
        return None

    # Asegurar bucket (idempotente)
    ensure_bucket(bucket)

    endpoint = f"{url}/storage/v1/object/{bucket}/{remote_path}"
    try:
        with open(local_path, "rb") as f:
            r = requests.post(
                endpoint,
                headers={**_headers(key), "Content-Type": content_type},
                data=f,
                timeout=30,
            )
        # Si ya existe, hacer upsert con PUT
        if r.status_code == 409:
            with open(local_path, "rb") as f:
                r = requests.put(
                    endpoint,
                    headers={**_headers(key), "Content-Type": content_type},
                    data=f,
                    timeout=30,
                )
        if 200 <= r.status_code < 300:
            print(f"[storage] Subido: {remote_path}")
            return True
        else:
            print("[storage] Error al subir:", r.status_code, r.text)
            return False
    except Exception as e:
        print("[storage] Excepción al subir:", e)
        return False


