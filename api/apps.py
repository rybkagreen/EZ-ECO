from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
    verbose_name = "API"

    def ready(self):
        # Импортируем views при запуске
        from api import views  # noqa
        # from api.serializers import base  # noqa  # временно отключено
