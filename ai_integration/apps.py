from django.apps import AppConfig


class AiIntegrationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ai_integration"
    verbose_name = "AI Integration"

    def ready(self):
        from ai_integration.services import ollama_service  # noqa
