from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.utils import timezone
from camaras.views import procesar_y_limpiar_datos

_started = False  # evita múltiples inicializaciones

def start():
    global _started
    if _started:
        print("[scheduler] Ya iniciado. Ignorando.")
        return
    _started = True

    # 1. Al iniciar el servidor, hacer un catch-up de días atrasados y limpieza
    print("[scheduler] Ejecutando procesamiento inicial de días atrasados...")
    procesar_y_limpiar_datos(forzar_hoy=False)
    
    # 2. Configurar el scheduler para ejecutarse cada día a las 00:01
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        procesar_y_limpiar_datos, 
        trigger=CronTrigger(hour=0, minute=1), 
        kwargs={'forzar_hoy': False},
        id="cierre_diario",
        replace_existing=True
    )
    scheduler.start()
    print("[scheduler] APScheduler iniciado. Siguiente ejecución a las 00:01.")
