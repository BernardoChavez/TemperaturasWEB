from rest_framework import serializers
from .models import TemperaturaCamaras, ConfiguracionCamara

class TemperaturaCamaraSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemperaturaCamaras
        fields = '__all__'

class ConfiguracionCamaraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionCamara
        fields = '__all__'