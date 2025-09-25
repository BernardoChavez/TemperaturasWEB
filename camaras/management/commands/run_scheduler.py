from django.core.management.base import BaseCommand
import os


class Command(BaseCommand):
    help = "Inicia el scheduler en primer plano (modo worker)."

    def handle(self, *args, **options):
        # Forzar que el scheduler arranque aunque el web lo tenga deshabilitado
        os.environ.pop('DISABLE_SCHEDULER', None)
        from monitoreo.scheduler import start
        self.stdout.write(self.style.SUCCESS("[worker] Iniciando scheduler…"))
        start()
        # Bloquear el proceso para que no salga
        try:
            import time
            while True:
                time.sleep(3600)
        except KeyboardInterrupt:
            self.stdout.write("[worker] Detenido por señal.")


