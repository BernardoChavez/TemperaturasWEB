from django.core.management.base import BaseCommand
from decimal import Decimal
from camaras.models import TemperaturaCamaras
from camaras.alerts import enviar_alerta_telegram


class Command(BaseCommand):
    help = "Inserta una lectura de temperatura de prueba y dispara alerta si corresponde."

    def add_arguments(self, parser):
        parser.add_argument("id_camara", type=int)
        parser.add_argument("temperatura", type=str)

    def handle(self, id_camara, temperatura, *args, **options):
        temp = Decimal(temperatura)
        obj = TemperaturaCamaras.objects.create(id_camara=id_camara, temperatura=temp)
        self.stdout.write(self.style.SUCCESS(f"Insertado: camara={id_camara}, temp={temp}"))

        # Rango del sistema (igual que en la vista)
        temp_min = 5
        temp_max = 30
        if (obj.temperatura < temp_min or obj.temperatura > temp_max) and not obj.alerta_enviada:
            enviar_alerta_telegram(
                f"⚠ Alerta: Cámara {obj.id_camara} - Temperatura {obj.temperatura}°C fuera de rango"
            )
            obj.alerta_enviada = True
            obj.save(update_fields=["alerta_enviada"])
            self.stdout.write(self.style.WARNING("Alerta enviada a Telegram"))

