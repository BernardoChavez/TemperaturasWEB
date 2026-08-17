# models.py
from django.db import models
from django.utils import timezone

class ConfiguracionCamara(models.Model):
    id_camara = models.IntegerField(unique=True)
    nombre = models.CharField(max_length=50, default="Cámara Principal")
    temp_min = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    temp_max = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)
    mantenimiento_hasta = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'configuracion_camaras'

class TemperaturaCamaras(models.Model):               
    id_camara = models.IntegerField()
    fecha_hora = models.DateTimeField(auto_now_add=True)
    temperatura = models.DecimalField(max_digits=5, decimal_places=2)
    alerta_enviada = models.BooleanField(default=False)  # <-- control de mensaje enviado
    
    # Nuevos campos HACCP
    revisada = models.BooleanField(default=False)
    fecha_revision = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'temperatura_camaras'