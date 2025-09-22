import os
import json
import requests


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


