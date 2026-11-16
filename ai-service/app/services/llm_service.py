import logging
import unicodedata
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI

from ..core.config import (
    GEMINI_MAX_RETRIES,
    GEMINI_MODEL,
    GEMINI_TEMPERATURE,
    GEMINI_TIMEOUT,
    GOOGLE_API_KEY,
    MAX_CONTEXT_CHARACTERS,
)


logger = logging.getLogger(__name__)

RESPONSE_FORMAT_INSTRUCTIONS = (
    "Présente une réponse claire et bien organisée dans la langue de la question. "
    "Fais des paragraphes courts; utilise des listes pour les énumérations et des étapes numérotées pour les procédures. "
    "N'ajoute des titres que si la réponse est longue, évite les répétitions et n'utilise pas de texte barré. "
    "Respecte toute consigne imposant une réponse exacte."
)


def is_document_overview_request(message: str) -> bool:
    normalized = "".join(
        character
        for character in unicodedata.normalize("NFKD", message.lower())
        if not unicodedata.combining(character)
    )
    analysis_terms = (
        ("resum",),
        ("synthese",),
        ("vue d'ensemble",),
        ("structure",),
        ("organis",),
        ("concept",),
        ("points importants",),
        ("points faibles",),
        ("objectifs pedagogiques",),
    )
    question_generation_terms = (
        ("question", "gener"),
        ("question", "idees"),
        ("propos", "question"),
        ("cre", "question"),
        ("suggestion", "question"),
    )
    return any(
        all(term in normalized for term in terms)
        for terms in (*analysis_terms, *question_generation_terms)
    )


@lru_cache(maxsize=1)
def _get_model() -> ChatGoogleGenerativeAI:
    if not GOOGLE_API_KEY:
        raise RuntimeError(
            "GOOGLE_API_KEY n'est pas configurée dans le fichier .env"
        )

    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        api_key=GOOGLE_API_KEY,
        temperature=GEMINI_TEMPERATURE,
        request_timeout=GEMINI_TIMEOUT,
        retries=GEMINI_MAX_RETRIES,
    )


def ask_llm(message: str, context: dict | None = None) -> str:
    context_text = str(context or {})[:MAX_CONTEXT_CHARACTERS]
    prompt = (
        "Tu es l'assistant sécurisé de la plateforme EduAI. "
        "Réponds à partir du contexte privé fourni pour l'utilisateur. "
        "Si l'information n'est pas dans le contexte, dis clairement qu'elle n'est pas disponible. "
        "N'invente aucune statistique, aucun cours, aucun examen et aucune donnée personnelle. "
        f"{RESPONSE_FORMAT_INSTRUCTIONS}\n"
        f"\nContexte autorisé de l'utilisateur:\n{context_text}\n\nQuestion:\n{message}"
    )
    logger.info("Gemini request started (message_length=%s, context_length=%s)", len(message), len(str(context_text)))
    response = _get_model().invoke(prompt)
    return getattr(response, "text", None) or str(response.content)


async def ask_llm_async(message: str, context: dict | None = None) -> str:
    context_text = str(context or {})[:MAX_CONTEXT_CHARACTERS]
    prompt = (
        "Tu es l'assistant sécurisé de la plateforme EduAI. "
        "Le champ routing indique les sources autorisées et le contexte contient uniquement des données déjà filtrées par les permissions. "
        "Réponds exclusivement à partir de ces données. "
        "Pour une question métier, utilise les nombres et résultats fournis et effectue les calculs nécessaires. "
        "Pour une question documentaire, utilise uniquement le contenu documentaire fourni. "
        "Si l'information n'est pas dans le contexte, dis clairement qu'elle n'est pas disponible. "
        "N'invente aucune statistique, aucun cours, aucun examen et aucune donnée personnelle. "
        f"{RESPONSE_FORMAT_INSTRUCTIONS}\n"
        f"\nContexte autorisé de l'utilisateur:\n{context_text}\n\nQuestion:\n{message}"
    )
    response = await _get_model().ainvoke(prompt)
    return getattr(response, "text", None) or str(response.content)


def ask_document_llm(message: str, document_context: str) -> str:
    prompt = (
        "Tu es un assistant pédagogique travaillant exclusivement à partir du document fourni. "
        "Réponds uniquement avec les informations présentes dans ce document. "
        "Si l'information n'est pas présente, réponds exactement : "
        "Je ne trouve pas cette information dans ce document. "
        "N'utilise aucune connaissance externe et n'invente rien. "
        f"{RESPONSE_FORMAT_INSTRUCTIONS}\n"
        f"\nDocument autorisé :\n{document_context}\n\nQuestion :\n{message}"
    )
    response = _get_model().invoke(prompt)
    return getattr(response, "text", None) or str(response.content)


async def ask_document_llm_async(message: str, document_context: str) -> str:
    if is_document_overview_request(message):
        instructions = (
            "La demande porte sur une analyse globale ou une activité dérivée du document. "
            "Appuie-toi sur l'ensemble des extraits fournis et n'utilise aucune connaissance "
            "externe. Tu peux formuler une appréciation si tu la justifies par des éléments "
            "du document; distingue clairement les observations des évaluations. "
            "Si le texte ne permet pas d'évaluer un aspect visuel ou une mise en page, "
            "précise cette limite. Pour générer des idées de questions, propose cinq "
            "questions variées dont les réponses peuvent être trouvées dans le document."
        )
    else:
        instructions = (
            "Réponds uniquement avec les informations présentes dans le document. "
            "Si l'information n'est pas présente, réponds exactement : "
            "Je ne trouve pas cette information dans ce document. "
            "N'utilise aucune connaissance externe et n'invente rien."
        )

    prompt = (
        "Tu es un assistant pédagogique travaillant exclusivement à partir du document fourni. "
        f"{instructions} {RESPONSE_FORMAT_INSTRUCTIONS}\n"
        f"\nDocument autorisé :\n{document_context[:MAX_CONTEXT_CHARACTERS]}\n\nQuestion :\n{message}"
    )
    response = await _get_model().ainvoke(prompt)
    return getattr(response, "text", None) or str(response.content)
