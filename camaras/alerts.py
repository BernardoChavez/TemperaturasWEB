import os
import requests

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

def enviar_alerta_telegram(mensaje):
    if not BOT_TOKEN or not CHAT_ID:
        print("[telegram] Variables de entorno faltantes: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID")
        return
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {
        "chat_id": CHAT_ID,
        "text": mensaje
    }
    try:
        r = requests.post(url, data=data, timeout=10)
        if r.status_code == 200:
            print("✅ Alerta enviada por Telegram:", mensaje)
        else:
            print("⚠ Error al enviar alerta. Status:", r.status_code, r.text)
    except Exception as e:
        print("❌ Excepción al enviar alerta:", e)
