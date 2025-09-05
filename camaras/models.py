# models.py
from django.db import models

class TemperaturaCamaras(models.Model):               
    id_camara = models.IntegerField()
    fecha_hora = models.DateTimeField(auto_now_add=True)
    temperatura = models.DecimalField(max_digits=5, decimal_places=2)
    alerta_enviada = models.BooleanField(default=False)  # <-- control de mensaje enviado

    class Meta:
        db_table = 'temperatura_camaras'