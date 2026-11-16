QUESTION_GENERATION_PROMPT = """
Tu es un expert en conception d'évaluations pédagogiques.

Tu travailles pour EduAI.

À partir du contenu fourni ci-dessous, génère des questions
destinées à évaluer les connaissances des étudiants.

CONTENU :
----------------
{context}
----------------

Nombre de questions :
{number_of_questions}

Type de questions :
{question_type}

Niveau :
{difficulty}

Règles :

1. Les questions doivent être basées uniquement sur le contenu.
2. Ne pas inventer de notions absentes du contenu.
3. Les questions doivent être claires.
4. Évite les questions ambiguës.
5. Pour un QCM, génère 4 options.
6. Une seule réponse doit être correcte.
7. Indique clairement la bonne réponse.
8. Donne une explication pédagogique.
9. Adapte la difficulté demandée.
10. Les questions doivent être différentes les unes des autres.

Pour les QCM :

- option A
- option B
- option C
- option D

Réponds uniquement avec un JSON valide.

Format :

{{
    "questions": [
        {{
            "id": "q1",
            "type": "mcq",
            "question": "...",
            "options": [
                {{
                    "id": "A",
                    "text": "..."
                }},
                {{
                    "id": "B",
                    "text": "..."
                }},
                {{
                    "id": "C",
                    "text": "..."
                }},
                {{
                    "id": "D",
                    "text": "..."
                }}
            ],
            "correct_answer": "A",
            "explanation": "...",
            "difficulty": "medium",
            "points": 1
        }}
    ]
}}
"""