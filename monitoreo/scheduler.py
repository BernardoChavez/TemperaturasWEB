import threading
import time
from datetime import timedelta
from django.utils import timezone
from camaras.models import TemperaturaCamaras
import pandas as pd
import os
from django.conf import settings
from camaras.views import exportar_datos_diarios as exportar_datos_diarios_view

_started = False  # evita múltiples hilos

def _reporte_path(fecha):
    reportes_dir = os.path.join(settings.BASE_DIR, "reportes")
    os.makedirs(reportes_dir, exist_ok=True)
    return os.path.join(reportes_dir, f"reporte_{fecha}.xlsx")

def exportar_datos_diarios():
    # Reutiliza la función de vistas que ya sube a Supabase y borra datos
    return exportar_datos_diarios_view()

def start():
    global _started
    if _started:
        print("[scheduler] Ya iniciado. Ignorando.")
        return
    _started = True

    def run():
        print("[scheduler] Iniciado. Esperando medianoche…")

        # Catch-up al arrancar: crea el reporte del día anterior si no existe
        ahora = timezone.localtime(timezone.now())
        ayer = (ahora - timedelta(days=1)).date()
        print(f"[DEBUG] Fecha actual local: {ahora}, Fecha de ayer calculada: {ayer}")
        
        archivo_ayer = _reporte_path(ayer)
        if not os.path.exists(archivo_ayer):
            print(f"[scheduler] Catch-up: creando reporte de ayer porque no existe el archivo: {archivo_ayer}")
            exportar_datos_diarios()
        else:
            print(f"[scheduler] El archivo del día anterior ya existe: {archivo_ayer}")

        # Bucle principal: ejecutar exactamente a las 00:00
        while True:
            ahora = timezone.localtime(timezone.now())
            if ahora.hour == 0 and ahora.minute == 0:
                exportar_datos_diarios()
                time.sleep(60)  # evita múltiples ejecuciones en el mismo minuto
            time.sleep(20)  # chequea cada 20s

    t = threading.Thread(target=run, daemon=True)
    t.start()
