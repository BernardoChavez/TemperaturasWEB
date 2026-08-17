from django.core.management.base import BaseCommand
from camaras.alerts import enviar_alerta_telegram


class Command(BaseCommand):
    help = "Envía un mensaje de prueba a Telegram usando las variables de entorno."

    def add_arguments(self, parser):
        parser.add_argument("mensaje", nargs="?", default="Prueba: alerta desde monitoreo ✅")

    def handle(self, mensaje, *args, **options):
        enviar_alerta_telegram(mensaje)
        self.stdout.write(self.style.SUCCESS("Mensaje enviado (si TOKEN/CHAT_ID están configurados)"))

