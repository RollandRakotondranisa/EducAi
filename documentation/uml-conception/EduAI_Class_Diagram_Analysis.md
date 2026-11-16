# Analyse de conception UML — EduAI

## Synthèse et périmètre

Le diagramme décrit le code présent, et non une architecture souhaitée. Le modèle relationnel est fondé sur les modèles enregistrés dans `backend/src/models/index.js` et leurs associations Sequelize. Les migrations sont utilisées pour vérifier les clés, contraintes, tenant et évolutions historiques. Les modules React et JavaScript sont documentés comme contexte lorsqu'ils sont des fonctions ou des composants, sans les transformer en classes.

| Indicateur | Valeur |
|---|---:|
| Classes persistantes Sequelize enregistrées | 23 |
| Classes Python de service réellement déclarées | 3 |
| Schémas Pydantic déclarés | 19 |
| Classes UML du diagramme (persistantes + IA) | 45 |
| Énumérations de domaine explicites dans le diagramme | 12 |
| Associations métier persistantes | 33 |
| Associations de contrats IA et dépendances entre classes | 9 |

Le diagramme contient 38 associations au total (33 métier persistantes et 5 entre schémas de contrats IA) et 4 dépendances. Une association many-to-many est détaillée par les classes de liaison effectivement enregistrées; les deux rôles de `Message` envers `User` sont distincts. Les dépendances du module IA sont comptées séparément des relations SQL.

## Architecture constatée

- **Backend** : Express.js, Sequelize/MySQL, modèles et migrations dans `backend/src`. Authentification par JWT d'accès vérifié contre une session stockée; autorisations de rôle et contexte multi-tenant. Les services/controllers sont des modules JavaScript, pas des classes ES déclarées.
- **Frontend** : React/Vite. Pages distinctes pour `admin`, `teacher` et `student`, ainsi que les vues communes. Les composants et pages sont majoritairement des fonctions/composants React; ils ne constituent pas des entités métier persistées.
- **Service IA** : l'application FastAPI est assemblée dans `ai-service/app/main.py`. Les schémas HTTP sont des classes Pydantic dans `app/schemas`; les services Python déclarés comme classes sont `RAGService`, `QuestionService` et `CorrectionService`. Les traitements documentaires, LLM et suggestions de notation sont aussi des fonctions de modules, et ne sont donc pas représentés comme classes.
- **RAG / modèles** : FAISS, LangChain, `GoogleGenerativeAIEmbeddings` et `ChatGoogleGenerativeAI` sont importés dans les sources. Le modèle chat est configuré par `GEMINI_MODEL` avec `gemini-3.6-flash` comme valeur par défaut observée; les embeddings ont par défaut `models/gemini-embedding-001`. La référence « Gemini 3.8 Flash » n'est pas corroborée par le code examiné.
- **Échanges backend–IA** : le backend appelle le service IA par HTTP/JSON (URL configurable `AI_SERVICE_URL`, défaut `http://127.0.0.1:8001`). Les identifiants de cours, document et utilisateur dans les contrats IA ne sont pas des associations SQL entre les modèles Python et Sequelize.

## Classes persistantes et attributs

Les propriétés ci-dessous sont celles déclarées dans les modèles actifs. Types SQL/Sequelize sont conservés lorsqu'ils sont significatifs. Les champs `createdAt`/`updatedAt` sont gérés par Sequelize pour les modèles avec `timestamps: true`; ils sont montrés dans le diagramme. Les attributs JavaScript Sequelize n'ont pas de visibilité UML déclarée : les signes `+`/`-` du diagramme sont une convention de représentation, pas un contrôle d'accès du runtime. Aucun modèle actif ne déclare de méthode métier d'instance propre; les méthodes ORM Sequelize générées sont hors inventaire.

| Classe | Attributs / types déclarés | Méthodes déclarées |
|---|---|---|
| `User` | `id: INTEGER`; `firstName`, `lastName: STRING(100)`; `email: STRING(150)` unique; `password: STRING(255)`; `role: ENUM(ADMIN, TEACHER, STUDENT)`; `isActive`, `isSuperAdmin`, `studentProfileCompleted: BOOLEAN`; `superAdminKey: STRING(32)?`; `organizationId`, `academicClassId: INTEGER?`; `refreshToken: TEXT?`; `resetPasswordToken: STRING(255)?`; `resetPasswordExpires: DATE?`; `avatar: TEXT(medium)?`; `specialty: STRING(150)?`; `classesHeld: STRING(255)?`; `university: STRING(180)?`; `academicTitle: STRING(120)?`; `bio: TEXT?`; `matricule: STRING(80)?` unique; `level: STRING(80)?`; `program: STRING(150)?`; `phone: STRING(30)?`; timestamps. | Aucune méthode personnalisée |
| `Session` | `id: UUID`; `userId: INTEGER`; `refreshTokenHash: STRING(255)`; `deviceInfo: STRING(255)?`; `ipAddress: STRING(45)?`; `expiresAt: DATE`; `revokedAt: DATE?`; timestamps. | Aucune |
| `Organization` | `id: INTEGER`; `name`, `normalizedName: STRING(180)` (`normalizedName` unique); `isLegacy: BOOLEAN`; timestamps. | Aucune |
| `UserRequest` | `id`, `userId: INTEGER`; `firstName`, `lastName: STRING(100)`; `email: STRING(150)`; `requestedRole: ENUM(TEACHER, STUDENT, ADMIN)`; `status: ENUM(PENDING, APPROVED, REJECTED)`; `approvedBy: INTEGER?`; `approvalReason: TEXT?`; `createdAt: DATE`; `approvedAt: DATE?`; timestamps Sequelize désactivés. | Aucune |
| `Audit` | `id`, `userId: INTEGER`; `action: STRING(100)`; `description: TEXT?`; `targetUserId: INTEGER?`; `ipAddress: STRING(45)?`; `userAgent: TEXT?`; `status: ENUM(SUCCESS, FAILED)`; `metadata: JSON?`; `createdAt: DATE`; timestamps Sequelize désactivés. | Aucune |
| `AcademicYear` | `id: INTEGER`; `name: STRING(20)`; `startsAt`, `endsAt: DATEONLY`; `isActive: BOOLEAN`; timestamps. | Aucune |
| `AcademicProgram` | `id: INTEGER`; `name: STRING(150)`; `isActive: BOOLEAN`; timestamps. | Aucune |
| `AcademicLevel` | `id: INTEGER`; `name: STRING(80)`; `position: INTEGER`; `isActive: BOOLEAN`; timestamps. | Aucune |
| `AcademicClass` | `id: INTEGER`; `name: STRING(100)`; `academicYearId`, `programId`, `levelId: INTEGER`; timestamps. Contrainte unique combinée sur année/programme/niveau/nom. | Aucune |
| `AcademicClassTeacher` | `academicClassId`, `teacherId: INTEGER` (clé primaire composite); timestamps. | Aucune |
| `Course` | `id: INTEGER`; `name: STRING(150)`; `code: STRING(50)`; `description: TEXT?`; `targetProgram: STRING(150)?`; `targetLevel: STRING(80)?`; `targetAcademicClassId: INTEGER?`; `teacherId: INTEGER`; timestamps. | Aucune |
| `CourseStudent` | `id`, `courseId`, `studentId: INTEGER`; timestamps. | Aucune |
| `Document` | `id`, `courseId`, `uploadedBy: INTEGER`; `originalName`, `fileName: STRING(255)`; `filePath: STRING(500)`; `mimeType: STRING(100)`; `extension: STRING(20)`; `fileSize: BIGINT`; `status: ENUM(UPLOADED, PROCESSING, PROCESSED, FAILED)`; timestamps. | Aucune |
| `DocumentHistory` | `id`, `documentId`, `userId: INTEGER`; `action: ENUM(UPLOAD, VIEW, DOWNLOAD, DELETE)`; `details: TEXT?`; timestamps. | Aucune |
| `Exam` | `id`, `courseId`, `teacherId: INTEGER`; `title: STRING(200)`; `description: TEXT?`; `targetProgram: STRING(150)?`; `targetLevel: STRING(80)?`; `targetAcademicClassId`, `expectedQuestionCount: INTEGER?`; `duration: INTEGER`; `startDate: DATE`; `endDate: DATE?`; `status: ENUM(DRAFT, PUBLISHED, CLOSED)`; timestamps. | Aucune |
| `ExamQuestion` | `id`, `examId: INTEGER`; `question: TEXT`; `type: ENUM(MCQ, OPEN)`; `points: DECIMAL(5,2)`; `position: INTEGER`; `options: JSON?`; `correctAnswer: TEXT?`; timestamps. | Aucune |
| `ExamAttempt` | `id`, `examId`, `studentId: INTEGER`; `startedAt`, `submittedAt`, `expiresAt: DATE?`; `status: ENUM(IN_PROGRESS, SUBMITTED, GRADED, ABSENT)`; `score`, `totalPoints: DECIMAL(5,2)?`; timestamps. | Aucune |
| `ExamAnswer` | `id`, `attemptId`, `questionId: INTEGER`; `selectedOption: STRING(255)?`; `answerText: TEXT?`; `pointsObtained: DECIMAL(10,2)?`; `isCorrected: BOOLEAN`; `feedback: TEXT?`; timestamps. | Aucune |
| `ExamResult` | `id`, `studentId`, `examId: INTEGER`; `attemptId: INTEGER?` unique; `status: ENUM(PRESENT, ABSENT)`; `score`, `totalPoints: DECIMAL(10,2)`; `totalQuestions`, `correctAnswers`, `wrongAnswers`, `unansweredQuestions: INTEGER`; `percentage: DECIMAL(5,2)`; `submittedAt: DATE?`; timestamps. | Aucune |
| `Message` | `id`, `senderId`, `recipientId: INTEGER`; `title: STRING(200)`; `content: TEXT`; `isRead: BOOLEAN`; `readAt: DATE?`; timestamps. | Aucune |
| `MessageAttachment` | `id`, `messageId: INTEGER`; `originalName`, `storedName: STRING(255)`; `mimeType: STRING(120)`; `filePath: STRING(500)`; `fileSize: BIGINT`; `kind: ENUM(FILE, IMAGE)`; timestamps. | Aucune |
| `Announcement` | `id`, `createdBy: INTEGER`; `title: STRING(200)`; `content: TEXT`; `targetRole: ENUM(STUDENT, TEACHER, ALL, ADMIN)`; `publishedAt: DATE`; `expiresAt: DATE?`; timestamps. | Aucune |
| `AnnouncementAttachment` | `id`, `announcementId: INTEGER`; `originalName`, `storedName: STRING(255)`; `mimeType: STRING(120)`; `filePath: STRING(500)`; `fileSize: BIGINT`; `kind: ENUM(FILE, IMAGE)`; timestamps. | Aucune |

## Classes et fonctions du module IA

### Classes Python de service (3)

| Classe | Attributs et méthodes constatés |
|---|---|
| `RAGService` | Attributs d'instance : `embeddings`, `vector_stores`, `_lock`, `index_dir`. Méthodes : `__init__()`; `split_text(text: str, document_id: int, course_id: int, teacher_id: int) -> List[Document]`; `create_index(text: str, document_id: int, course_id: int, teacher_id: int) -> dict`; `search(query: str, course_id: int, document_id: Optional[int], teacher_id: int, k: int = 5) -> List[Document]`; `get_context(query, course_id, document_id, teacher_id, k=5) -> str`; `get_full_context(course_id, teacher_id, document_id=None) -> str`; `_load_indexes()`. Le stockage indexe par cours et conserve des index FAISS sur disque. |
| `QuestionService` | Attribut d'instance `llm`; `__init__()`; `generate_questions(context, number_of_questions=5, question_type="mcq", difficulty="medium") -> dict`; `generate_from_document(query, teacher_id, course_id, document_id, number_of_questions=5, question_type="mcq", difficulty="medium") -> dict`. |
| `CorrectionService` | Attribut d'instance `llm`; `__init__()`; `correct_answer(question, expected_answer, student_answer, points=1) -> dict`. |

`document_service`, `llm_service`, `exam_grading_service` et les routeurs FastAPI déclarent des fonctions, pas des classes de service. Ils sont décrits ici et dans le diagramme comme composants/fonctions, sans classes fictives.

### Schémas Pydantic (19)

| Classe | Champs déclarés | Méthodes |
|---|---|---|
| `LLMRequest` | `message: str`; `role: Literal[TEACHER, STUDENT, ADMIN]`; `context: dict[str, Any]`. | Aucune |
| `DocumentAnalysisResponse` | `filename`, `file_type`, `text: str`; `characters`, `words: int`. | Aucune |
| `DocumentIndexRequest` | `document_id`, `course_id`, `teacher_id: int`; `text: str`. | Aucune |
| `DocumentIndexResponse` | `document_id`, `course_id`, `chunks: int`; `status: str`. | Aucune |
| `RAGSearchRequest` | `query: str`; `course_id`, `document_id`, `teacher_id`, `k: int`. | Aucune |
| `DocumentChatRequest` | `message: str`; `document_id: Optional[int]`; `course_id`, `teacher_id: int`. | Aucune |
| `CourseChatRequest` | `message: str`; `course_id`, `teacher_id: int`. | Aucune |
| `RAGSearchResult` | `content: str`; `document_id`, `course_id: int`. | Aucune |
| `RAGSearchResponse` | `results: list[RAGSearchResult]`; `query: str`; `course_id: int`. | Aucune |
| `QuestionOption` | `id`, `text: str`. | Aucune |
| `Question` | `id: str`; `type: Literal[mcq, open]`; `question: str`; `options: list[QuestionOption]`; `correct_answer`, `explanation: Optional[str]`; `difficulty: Literal[easy, medium, hard]`; `points: int`. | `validate_mcq()` |
| `QuestionGenerationRequest` | `query: str`; `teacher_id`, `document_id`, `course_id`, `number_of_questions: int`; `question_type: Literal[mcq, open]`; `difficulty: Literal[easy, medium, hard]`. | Aucune |
| `QuestionGenerationResponse` | `questions: list[Question]`; `source: Optional[str]`. | Aucune |
| `CorrectionRequest` | `question`, `expected_answer`, `student_answer: str`; `points: int`. | Aucune |
| `CorrectionResponse` | `score`, `max_score: float`; `is_correct: bool`; `feedback`, `explanation: str`; `strengths`, `weaknesses: list[str]`. | Aucune |
| `ExamGradingQuestion` | `question_id: int`; `question: str`; `type: Literal[MCQ, OPEN]`; `points: float`; `options: list[str]`; `expected_answer`, `student_answer: Optional[str]`. | Aucune |
| `ExamGradingRequest` | `questions: list[ExamGradingQuestion]`. | Aucune |
| `ExamGradeSuggestion` | `question_id: int`; `points_obtained: float`; `feedback`, `rationale: str`. | Aucune |
| `ExamGradingResponse` | `grades: list[ExamGradeSuggestion]`. | Aucune |

Les contrats question/correction et recherche RAG sont présents comme classes Pydantic, mais leur présence seule ne prouve pas qu'une route active les expose. Dans l'assemblage FastAPI observé, les routes actives incluent santé, chat LLM, documents (analyse/indexation/chat) et suggestions de correction d'examen. La validation d'examen est exécutée via `ExamGradingRequest`/`ExamGradingResponse`.

## Relations, multiplicités et justification

Multiplicités déduites des `belongsTo`, `hasMany`, `hasOne`, `belongsToMany`, de `allowNull`, des clés uniques et des migrations. Chaque parent peut avoir zéro enfant; une FK requise donne exactement un parent pour chaque enfant. Les modèles ne déclarent pas toujours une FK SQL dans `references`, donc la relation indiquée reflète l'association ORM quand elle n'est pas matérialisée par une contrainte de migration explicite. Les relations many-to-many passent par les classes de liaison.

| Relation (parent → enfant / extrémités) | Type UML / multiplicités | Justification |
|---|---|---|
| `Organization` — `User` | Association; organisation `0..1` par utilisateur, `0..*` utilisateurs par organisation | `User.organizationId` nullable; `User.belongsTo(Organization)` et `Organization.hasMany(User)`. |
| `User` — `Session` | Association; session → `1` user, user → `0..*` sessions | FK `Session.userId` obligatoire; associations bidirectionnelles; suppression cascade de session depuis user. |
| `AcademicYear`, `AcademicProgram`, `AcademicLevel` — `AcademicClass` | Association; classe → exactement `1` de chaque, parent → `0..*` classes | FK de classe non nullable; associations ORM et migrations académiques. |
| `AcademicClass` — `User` étudiant | Association; étudiant → `0..1` classe, classe → `0..*` étudiants | `User.academicClassId` nullable; `AcademicClass.hasMany(User)`. |
| `AcademicClass` — `User` enseignant | Many-to-many `0..*` ↔ `0..*` | `belongsToMany` via `AcademicClassTeacher`. |
| `AcademicClass` — `AcademicClassTeacher` — `User` | Associations; chaque ligne de liaison référence exactement une classe et un enseignant | Clé composite `(academicClassId, teacherId)` et deux `belongsTo`; migrations avec références/FK. |
| `User` enseignant — `Course` | Association; cours → `1` enseignant, enseignant → `0..*` cours | `Course.teacherId` non nullable; `User.hasMany(Course)`. |
| `Course` — `CourseStudent` — `User` étudiant | Associations de liaison; cours et étudiant chacun `1` par inscription, chacun `0..*` inscriptions | `belongsToMany` via `CourseStudent`; les deux FK déclarées non-nullables. |
| `AcademicClass` — `Course` | Association; cours → `0..1` classe cible, classe → `0..*` cours | FK optionnelle `targetAcademicClassId`. |
| `Course` — `Document` | Association; document → `1` cours, cours → `0..*` documents | `courseId` requis et `hasMany`/`belongsTo`; suppression cascade configurée côté association. |
| `User` uploader — `Document` | Association; document → `1` uploader, utilisateur → `0..*` documents | `uploadedBy` requis et associations déclarées. |
| `Document` — `DocumentHistory` | Composition de présentation avec cascade; document `1` ↔ entrées `0..*` | `hasMany` document history avec `onDelete: CASCADE`; la composition exprime la dépendance de cycle de vie, non une catégorie Sequelize. |
| `User` acteur — `DocumentHistory` | Association; historique → `1` utilisateur, utilisateur → `0..*` événements | `userId` requis et `belongsTo`/`hasMany`. |
| `Course` — `Exam` | Association; examen → `1` cours, cours → `0..*` examens | `courseId` requis; `Course.hasMany(Exam)`. |
| `User` enseignant — `Exam` | Association; examen → `1` enseignant, utilisateur → `0..*` examens | `teacherId` requis et associations déclarées. |
| `AcademicClass` — `Exam` | Association; examen → `0..1` classe cible, classe → `0..*` examens | FK cible nullable. |
| `Exam` — `ExamQuestion` | Composition de présentation avec cascade; question → `1` examen, examen → `0..*` questions | FK `examId` requise; `hasMany` avec `onDelete: CASCADE`. |
| `Exam` — `ExamAttempt` | Association; tentative → `1` examen, examen → `0..*` tentatives | `examId` requis et associations. |
| `User` étudiant — `ExamAttempt` | Association; tentative → `1` étudiant, utilisateur → `0..*` tentatives | `studentId` requis. |
| `ExamAttempt` — `ExamAnswer` | Association; réponse → `1` tentative, tentative → `0..*` réponses | `attemptId` requis; suppression cascade configurée. |
| `ExamQuestion` — `ExamAnswer` | Association; réponse → `1` question, question → `0..*` réponses | `questionId` requis; suppression cascade configurée. |
| `ExamAttempt` — `ExamResult` | Association `0..1` ↔ `0..1` | `ExamAttempt.hasOne`; `ExamResult.attemptId` nullable et unique. |
| `Exam` — `ExamResult` | Association; résultat → `1` examen, examen → `0..*` résultats | FK non-nullable; `hasMany`/`belongsTo`. |
| `User` étudiant — `ExamResult` | Association; résultat → `1` étudiant, utilisateur → `0..*` résultats | FK non-nullable; `hasMany`/`belongsTo`. |
| `User` expéditeur — `Message` | Association nommée `sender`; message → `1` utilisateur, utilisateur → `0..*` messages | FK `senderId` non-nullable. |
| `User` destinataire — `Message` | Association nommée `recipient`; message → `1` utilisateur, utilisateur → `0..*` messages | FK `recipientId` non-nullable. |
| `Message` — `MessageAttachment` | Composition de présentation avec cascade; pièce jointe → `1` message, message → `0..*` pièces | FK obligatoire; références et suppression cascade déclarées. |
| `User` auteur — `Announcement` | Association; annonce → `1` auteur, utilisateur → `0..*` annonces | `createdBy` requis et associations déclarées. |
| `Announcement` — `AnnouncementAttachment` | Composition de présentation avec cascade; pièce jointe → `1` annonce, annonce → `0..*` pièces | FK obligatoire et association `hasMany` avec suppression cascade. |
| `QuestionGenerationResponse` — `Question` — `QuestionOption` | Compositions de contrat `1` vers `0..*` | Les champs Pydantic sont des listes; ce ne sont pas des relations DB. |
| `RAGSearchResponse` — `RAGSearchResult` | Composition de contrat `1` vers `0..*` | Champ `results: list[RAGSearchResult]`. |
| `ExamGradingRequest` — `ExamGradingQuestion` | Composition de contrat `1` vers `1..*` | Schéma `questions` avec minimum de longueur 1. |
| `ExamGradingResponse` — `ExamGradeSuggestion` | Composition de contrat `1` vers `0..*` | Champ `grades: list[ExamGradeSuggestion]`. |

Les compositions des contrats Pydantic expriment uniquement la structure d'un message d'API et ne signifient pas une persistance. Les associations de contrats de chat/indexation avec les fonctions de route ne sont pas modélisées comme des liens ORM.

## Rôles et autorisation

`User.role` est un enum `ADMIN`, `TEACHER`, `STUDENT`. `isSuperAdmin` est un booléen; le middleware traite le super-administrateur comme un compte `ADMIN` avec privilèges globaux. Il n'existe pas de classes distinctes `SuperAdmin`, `Admin`, `Teacher` ou `Student`, ni de généralisation UML correspondante. Le contexte tenant s'appuie sur `organizationId` et `AsyncLocalStorage`; `Organization` représente l'établissement/tenant.

Les routes Express appliquent authentification et contrôle de rôle. Les sessions persistées portent les hashes de refresh token et les dates d'expiration/révocation; le JWT d'accès référence une session vérifiée en base. Les rôles sont également utilisés dans les gardes/pages du frontend.

## Éléments absents, divergences et réserves

- `backend/src/models/Answer.js`, `Grade.js` et `ActivityLog.js` existent mais sont vides; ils ne représentent aucune classe active.
- `Question.js` contient un modèle Sequelize ancien, mais n'est pas importé par `models/index.js`. Ses associations attendent des `AnswerOption` et `Answer` qui ne sont pas enregistrés (et `Answer.js` est vide). Ces classes ne figurent pas dans le diagramme.
- Les entités réellement actives pour les examens sont `ExamQuestion`, `ExamAttempt`, `ExamAnswer` et `ExamResult`. Le frontend a des pages de prise d'examen, correction et résultats; elles n'ajoutent pas de persistance.
- `Audit.userId`, `Audit.targetUserId`, `UserRequest.userId` et `UserRequest.approvedBy` sont des identifiants scalaires sans associations Sequelize visibles; ils ne sont pas dessinés comme associations, même si les noms suggèrent des références.
- Les migrations courantes ajoutent `organizationId` à plusieurs tables et aux scopes tenant; le champ est injecté dans des modèles à l'exécution par `installTenantScopes`, plutôt que déclaré individuellement dans les attributs du modèle. Il n'est pas répété comme propriété métier dans chaque classe du diagramme.
- La migration `create-exam-results` initiale déclare `attemptId` non nullable, alors que le modèle courant l'autorise nullable et la migration ultérieure permet les résultats d'absents. Le diagramme suit le modèle actif et signale cette divergence historique.
- Le registre FastAPI actif est `ai-service/app/main.py`; il existe aussi des arbres `src/ai_service`, `services/`, `schemas/`, `routes/`, `chains/` et `prompts/` au niveau supérieur. Ils contiennent des doublons/variantes historiques; leur statut de déploiement n'est pas déterminable par les seuls fichiers parcourus.
- Aucun modèle de conversation IA ou message IA n'est persisté dans les modèles enregistrés. Les messages du chat assistant sont échangés par HTTP et ne sont pas des `Message` de la messagerie utilisateur.
- Les noms de colonnes de tenant sont ajoutés dynamiquement; les associations/migrations historiques peuvent varier. Aucune base n'a été connectée et aucune migration n'a été exécutée.
- Le dépôt comportait déjà des modifications applicatives/configuration et des artefacts XMI non suivis avant ce travail. L'analyse n'a modifié aucun de ces fichiers ni aucun code source; seul ce dossier documentaire est concerné par les livrables.

## Références principales examinées

- Modèles/associations : `backend/src/models/index.js`, `User.js`, `Session.js`, `Organization.js`, `UserRequest.js`, `Audit.js`, `AcademicYear.js`, `AcademicProgram.js`, `AcademicLevel.js`, `AcademicClass.js`, `AcademicClassTeacher.js`, `Course.js`, `CourseStudent.js`, `Document.js`, `DocumentHistory.js`, `Exam.js`, `ExamQuestion.js`, `ExamAttempt.js`, `ExamAnswer.js`, `ExamResult.js`, `Message.js`, `MessageAttachment.js`, `Announcement.js`, `AnnouncementAttachment.js`, `Question.js`, `Answer.js`, `Grade.js`, `ActivityLog.js`.
- Schéma historique : `backend/src/migrations/` (33 migrations, notamment création utilisateurs/sessions/cours/examens/résultats, structure académique, pièces jointes, tenancy/organisations, cibles d'examen et résultats d'absence).
- Backend : `backend/src/app.js`, `server.js`, `routes/`, `controllers/`, `services/`, `middleware/auth.middleware.js`, `middleware/role.middleware.js`, `utils/tenant-context.js`, `config/`, `backend/package.json`.
- Frontend : `frontend/src/App.jsx`, `pages/admin/`, `pages/teacher/`, `pages/student/`, `pages/common/`, `components/`, `utils/api.js`, `utils/session.js`.
- IA active : `ai-service/app/main.py`, `app/routes/{health,llm,documents,exam_grading}.py`, `app/schemas/{llm,document,question,correction,exam_grading}.py`, `app/services/{rag_service,question_service,correction_service,llm_service,document_service,exam_grading_service}.py`, `app/core/config.py`, `pyproject.toml`.
- Traitements documentaires : `ai-service/loaders/{pdf_loader,word_loader,powerpoint_loader}.py`.

## Livrables, rendu et import Visual Paradigm

- `EduAI_Class_Diagram.puml` : diagramme global PlantUML, organisé selon les huit packages fonctionnels demandés; les types énumérés sont regroupés séparément.
- `EduAI_Class_Diagram.mmd` : représentation Mermaid `classDiagram`.
- `EduAI_Class_Diagram.xmi` : XMI UML 2.x structuré, généré à partir du même modèle que le diagramme; contient les huit packages fonctionnels, un package de types/énumérations, classes, propriétés typées, opérations, associations et multiplicités.
- SVG/PNG : non générés, car aucun moteur PlantUML/Graphviz/Java/CLI Mermaid n'est disponible dans l'environnement; les outils de rendu ne sont pas installés au titre de cette tâche de documentation.

Le XMI est fourni comme candidat d'import Visual Paradigm. Sa structure XML et ses références internes sont vérifiées dans le rapport de validation; l'import effectif dans Visual Paradigm n'a pas été exécuté et la compatibilité spécifique à sa version n'est donc pas garantie. PlantUML est le format source recommandé pour modification/relecture; l'import XMI est à privilégier pour reconstituer des éléments UML éditables.
