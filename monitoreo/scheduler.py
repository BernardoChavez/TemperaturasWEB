import threading
import time
from datetime import timedelta
from django.utils import timezone
from camaras.models import TemperaturaCamaras
import pandas as pd
import os
from django.conf import settings

_started = False  # evita múltiples hilos

def _reporte_path(fecha):
    reportes_dir = os.path.join(settings.BASE_DIR, "reportes")
    os.makedirs(reportes_dir, exist_ok=True)
    return os.path.join(reportes_dir, f"reporte_{fecha}.xlsx")

def exportar_datos_diarios():
    ayer = timezone.localtime(timezone.now() - timedelta(days=1)).date()
    
    # Traer datos del día anterior
    datos_del_ayer = [
        t for t in TemperaturaCamaras.objects.all()
        if timezone.localtime(t.fecha_hora).date() == ayer
    ]

    if not datos_del_ayer:
        print(f"[scheduler] No hay datos para exportar del día {ayer}.")
        return None

    # Crear DataFrame
    df = pd.DataFrame([{
        "id_camara": t.id_camara,
        "temperatura": float(t.temperatura),
        "fecha_hora": timezone.localtime(t.fecha_hora).strftime("%Y-%m-%d %H:%M:%S"),
    } for t in datos_del_ayer])

    archivo = _reporte_path(ayer)
    df.to_excel(archivo, index=False)

    # --- BORRAR LOS DATOS DE LA BASE DE DATOS AQUÍ MISMO ---
    TemperaturaCamaras.objects.filter(fecha_hora__date=ayer).delete()

    print(f"[scheduler] ✅ Reporte diario creado: {archivo} y datos eliminados de la DB")
    return archivo

def start():
    global _started
    if _started:
        print("[scheduler] Ya iniciado. Ignorando.")
        return
    _started = True

    def run():
        print("[scheduler] Iniciado. Esperando medianoche…")

        # Catch-up al arrancar: si ya pasaron las 00:00 y NO existe el archivo de ayer, créalo.
        ahora = timezone.localtime(timezone.now())
        ayer = (ahora - timedelta(days=1)).date()
        if ahora.hour >= 0 and ahora.minute >= 1:  # arrancaste después de 00:01
            archivo_ayer = _reporte_path(ayer)
            if not os.path.exists(archivo_ayer):
                print("[scheduler] Catch-up: creando reporte de ayer porque no existe.")
                exportar_datos_diarios()

        # Bucle principal: ejecutar exactamente a las 00:00
        while True:
            ahora = timezone.localtime(timezone.now())
            if ahora.hour == 0 and ahora.minute == 0:
                exportar_datos_diarios()
                time.sleep(60)  # evita múltiples ejecuciones en el mismo minuto
            time.sleep(20)  # chequea cada 20s

    t = threading.Thread(target=run, daemon=True)
    t.start()
