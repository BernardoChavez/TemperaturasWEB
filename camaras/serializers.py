from rest_framework import serializers
from .models import TemperaturaCamaras

class TemperaturaCamaraSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemperaturaCamaras
        fields = '__all__'