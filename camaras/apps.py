from django.apps import AppConfig
import os

class CamarasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'camaras'

    def ready(self):
        # Permitir desactivar explícitamente el scheduler si se necesita
        if os.environ.get('DISABLE_SCHEDULER') == '1':
            return
        try:
            from monitoreo.scheduler import start
            start()
        except Exception as e:
            print(f"[scheduler] Error al iniciar: {e}")
