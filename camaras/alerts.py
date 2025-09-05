import requests

# Token de tu bot y chat_id
BOT_TOKEN = "8398893129:AAHQQFRVgv35OKGgiDIOhyAbEAjdxflQi_s"
CHAT_ID = "716313145"

def enviar_alerta_telegram(mensaje):
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
