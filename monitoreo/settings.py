import os
from pathlib import Path
import dj_database_url

# 📌 Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# 🔑 Seguridad
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_secret_key')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# 🔹 Dominio de Render
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'monitoreo-yyoy.onrender.com').split(',')

# 🧩 Aplicaciones instaladas
INSTALLED_APPS = [
    'django_crontab',
    'camaras',
    'rest_framework',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# 🧱 Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 🌐 URLs y templates
ROOT_URLCONF = 'monitoreo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # 🔹 Carpeta principal de templates
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'monitoreo.wsgi.application'

# 🗄️ Base de datos (Supabase)
DATABASES = {
    "default": dj_database_url.config(
        default=f"postgres://{os.environ.get('DB_USER','user')}:{os.environ.get('DB_PASSWORD','pass')}@{os.environ.get('DB_HOST','host')}:{os.environ.get('DB_PORT','5432')}/{os.environ.get('DB_NAME','dbname')}",
        conn_max_age=600,
        ssl_require=True
    )
}

# 🌍 Internacionalización
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True

# 📦 Archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# 🔢 Auto field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 🌐 CORS
CORS_ALLOW_ALL_ORIGINS = True

# 📂 Directorio de reportes
REPORTES_DIR = BASE_DIR / 'reportes'
os.makedirs(REPORTES_DIR, exist_ok=True)

# ⏰ CRON jobs
CRONJOBS = [
    ('0 0 * * *', 'camaras.views.exportar_datos_diarios')
]
