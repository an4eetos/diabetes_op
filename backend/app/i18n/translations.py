import json
from pathlib import Path
from typing import Any


SUPPORTED_LANGUAGES = {"ru", "kk", "en"}
DEFAULT_LANGUAGE = "ru"


class TranslationService:
    def __init__(self) -> None:
        self.locales_path = Path(__file__).resolve().parent / "locales"
        self._cache: dict[str, dict[str, Any]] = {}

    def get(self, language: str | None) -> dict[str, Any]:
        lang = language if language in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
        if lang not in self._cache:
            with (self.locales_path / f"{lang}.json").open(encoding="utf-8") as locale_file:
                self._cache[lang] = json.load(locale_file)
        return self._cache[lang]

    def recommendation(self, code: str, language: str | None) -> str:
        translations = self.get(language)
        return translations["recommendations"].get(code, code)

