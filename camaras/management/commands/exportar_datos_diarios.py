from django.core.management.base import BaseCommand
from camaras.views import exportar_datos_diarios


class Command(BaseCommand):
    help = "Exporta datos del día anterior a Excel y borra los registros."

    def handle(self, *args, **options):
        archivo = exportar_datos_diarios()
        if archivo:
            self.stdout.write(self.style.SUCCESS(f"Reporte generado: {archivo}"))
        else:
            self.stdout.write("No hay datos para exportar.")


