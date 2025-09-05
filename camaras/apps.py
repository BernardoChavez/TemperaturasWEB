from django.apps import AppConfig
import os

class CamarasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'camaras'

    def ready(self):
        # Evitar doble ejecución en autoreload y comandos que no sean runserver
        if os.environ.get('RUN_MAIN') != 'true':
            return
        try:
            from monitoreo.scheduler import start
            start()
        except Exception as e:
            print(f"[scheduler] Error al iniciar: {e}")
