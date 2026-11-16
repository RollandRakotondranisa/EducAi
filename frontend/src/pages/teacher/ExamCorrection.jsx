import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, FileText, Loader2, Save, Sparkles } from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { Button } from "@/components/ui/Button";
import apiFetch from "@/utils/api";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Date non disponible";

export default function ExamCorrectionPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [copies, setCopies] = useState([]);
  const [selectedCopyId, setSelectedCopyId] = useState("");
  const [copy, setCopy] = useState(null);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiRationales, setAiRationales] = useState({});
  const [hasAiSuggestion, setHasAiSuggestion] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const correctionRef = useRef(null);

  const selectedCopy = useMemo(
    () => copies.find((item) => String(item.id) === String(selectedCopyId)),
    [copies, selectedCopyId],
  );

  useEffect(() => {
    let active = true;
    apiFetch(`/exams/${examId}/copies`)
      .then((response) => {
        if (!active) return;
        setExam(response.exam);
        const loadedCopies = response.data ?? [];
        setCopies(loadedCopies);
      })
      .catch((loadError) => active && setError(loadError.message || "Impossible de charger les copies."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [examId]);

  useEffect(() => {
    if (!selectedCopyId) {
      setCopy(null);
      setGrades({});
      setAiRationales({});
      setHasAiSuggestion(false);
      return undefined;
    }
    let active = true;
    setLoadingCopy(true);
    setCopy(null);
    setGrades({});
    setAiRationales({});
    setHasAiSuggestion(false);
    setError("");
    setNotice("");
    apiFetch(`/exams/${examId}/copies/${selectedCopyId}`)
      .then((response) => {
        if (!active) return;
        const data = response.data;
        setCopy(data);
        setAiRationales({});
        setHasAiSuggestion(false);
        const answersByQuestion = new Map((data.attempt.answers ?? []).map((answer) => [String(answer.questionId), answer]));
        setGrades(Object.fromEntries((data.exam.questions ?? []).map((question) => {
          const answer = answersByQuestion.get(String(question.id));
          return [question.id, {
            pointsObtained: answer?.isCorrected ? String(answer.pointsObtained ?? 0) : "",
            feedback: answer?.feedback ?? "",
          }];
        })));
      })
      .catch((loadError) => active && setError(loadError.message || "Impossible de charger cette copie."))
      .finally(() => active && setLoadingCopy(false));
    return () => { active = false; };
  }, [examId, selectedCopyId]);

  const questions = copy?.exam?.questions ?? [];
  const allQuestionsScored = questions.length > 0 && questions.every((question) => {
    const value = grades[question.id]?.pointsObtained;
    return value !== "" && value !== undefined && Number.isFinite(Number(value));
  });

  function updateGrade(questionId, field, value) {
    setGrades((current) => ({
      ...current,
      [questionId]: { ...current[questionId], [field]: value },
    }));
  }

  function viewCopy(copyId) {
    if (String(copyId) === String(selectedCopyId)) {
      setSelectedCopyId("");
      return;
    }
    setSelectedCopyId(String(copyId));
    window.requestAnimationFrame(() => {
      correctionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function saveCorrection(event) {
    event.preventDefault();
    if (!copy || !allQuestionsScored || saving) return;
    if (hasAiSuggestion && !window.confirm("Confirmez-vous cette correction ? Les notes et commentaires seront enregistrés et publiés pour l’étudiant. Vous pouvez encore modifier les propositions avant de confirmer.")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(`/exams/${examId}/copies/${copy.attempt.id}/grade`, {
        method: "PATCH",
        body: {
          grades: questions.map((question) => ({
            questionId: question.id,
            pointsObtained: Number(grades[question.id].pointsObtained),
            feedback: grades[question.id].feedback.trim() || null,
          })),
        },
      });
      const { attempt, result } = response.data;
      setCopy((current) => current ? {
        ...current,
        attempt: { ...current.attempt, ...attempt },
      } : current);
      setCopies((current) => current.map((item) => item.id === attempt.id
        ? { ...item, status: attempt.status, score: result.score, totalPoints: result.totalPoints }
        : item));
      setHasAiSuggestion(false);
      setAiRationales({});
      setNotice("Correction enregistrée. La note est maintenant disponible pour l’étudiant.");
    } catch (saveError) {
      setError(saveError.message || "Impossible d’enregistrer la correction.");
    } finally {
      setSaving(false);
    }
  }

  async function generateAiSuggestion() {
    if (!copy || String(copy.attempt.id) !== String(selectedCopyId) || generatingAi || saving) return;
    const confirmed = window.confirm(
      "Pour générer une proposition de correction, les questions et les réponses de cette copie seront envoyées à Google Gemini. Aucune note ne sera enregistrée ni publiée par cette action. Continuer ?",
    );
    if (!confirmed) return;

    setGeneratingAi(true);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(`/exams/${examId}/copies/${copy.attempt.id}/ai-suggestions`, {
        method: "POST",
      });
      const suggestions = response.data?.suggestions ?? [];
      const nextGrades = {};
      const nextRationales = {};
      for (const suggestion of suggestions) {
        nextGrades[suggestion.questionId] = {
          pointsObtained: String(suggestion.pointsObtained),
          feedback: suggestion.feedback,
        };
        nextRationales[suggestion.questionId] = suggestion.rationale;
      }
      setGrades((current) => ({ ...current, ...nextGrades }));
      setAiRationales(nextRationales);
      setHasAiSuggestion(true);
      setNotice("Proposition IA générée. Vérifiez et modifiez chaque note avant de confirmer la publication.");
    } catch (suggestionError) {
      setError(suggestionError.message || "Impossible de générer une proposition de correction.");
    } finally {
      setGeneratingAi(false);
    }
  }

  return (
    <TeacherShell
      nav={teacherNav}
      role="enseignant"
      title="Correction des examens"
      subtitle={exam?.title || "Copies des étudiants"}
    >
      {error && <div className="mb-5 rounded-xl border border-error/20 bg-error-soft p-4 text-sm text-error" role="alert">{error}</div>}
      {notice && <div className="mb-5 rounded-xl border border-success/20 bg-success-soft p-4 text-sm text-success" role="status">{notice}</div>}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" />Chargement des copies...</div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
            <span className="flex items-center gap-2 font-medium"><FileText className="size-4 text-primary" />{copies.length} copie(s)</span>
            <span className="flex items-center gap-2 text-warning"><FileText className="size-4" />{copies.filter((item) => item.status === "SUBMITTED").length} à corriger</span>
            <span className="flex items-center gap-2 text-success"><CheckCircle2 className="size-4" />{copies.filter((item) => item.status === "GRADED").length} corrigée(s)</span>
          </div>

          <section className="card-surface min-w-0 overflow-hidden p-3 sm:p-4">
            <div className="mb-3">
              <h2 className="text-base font-semibold tracking-tight">Copies des étudiants</h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">{exam?.course?.name || "Sélectionnez une copie pour afficher sa correction."}</p>
            </div>
            {copies.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune copie soumise pour cet examen.</p>
            ) : (
              <div className="max-h-[55dvh] overflow-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Étudiant</th>
                      <th className="px-3 py-2.5 font-semibold">Matricule</th>
                      <th className="px-3 py-2.5 font-semibold">Date de soumission</th>
                      <th className="px-3 py-2.5 font-semibold">Statut</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copies.map((item) => {
                      const name = [item.student?.firstName, item.student?.lastName].filter(Boolean).join(" ") || item.student?.email || "Étudiant";
                      const isSelected = String(item.id) === String(selectedCopyId);
                      return (
                        <tr key={item.id} className={`border-t border-border ${isSelected ? "bg-primary-soft/60" : "hover:bg-muted/50"}`}>
                          <td className="max-w-56 truncate px-3 py-2.5 font-medium" title={name}>{name}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{item.student?.matricule || "—"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{formatDate(item.submittedAt)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === "GRADED" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                              {item.status === "GRADED" ? `Corrigée · ${item.score}/${item.totalPoints}` : "À corriger"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="size-9 px-0"
                              onClick={() => viewCopy(item.id)}
                              disabled={saving || generatingAi}
                              aria-label={isSelected ? `Fermer la correction de ${name}` : `Voir la copie de ${name}`}
                              title={isSelected ? "Fermer la correction" : "Afficher la copie à corriger"}
                            >
                              {isSelected ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section ref={correctionRef} className="scroll-mt-4 card-surface min-w-0 p-3 sm:p-4">
            {!selectedCopyId ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cliquez sur l’icône œil d’une ligne pour afficher la copie à corriger.</p>
            ) : (
              <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold tracking-tight">
                    {selectedCopy ? `Copie de ${[selectedCopy.student?.firstName, selectedCopy.student?.lastName].filter(Boolean).join(" ") || selectedCopy.student?.email || "l’étudiant"}` : "Réponses de l’étudiant"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedCopy ? `Soumise le ${formatDate(selectedCopy.submittedAt)} · Total : ${questions.reduce((sum, question) => sum + Number(question.points || 0), 0)} points` : "Chargement des réponses..."}
                  </p>
                </div>
                {copy?.attempt?.status === "GRADED" && <span className="shrink-0 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">{copy.attempt.score}/{copy.attempt.totalPoints}</span>}
                {copy && (
                  <Button type="button" variant="outline" size="sm" onClick={generateAiSuggestion} disabled={generatingAi || saving}>
                    {generatingAi ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {generatingAi ? "Génération..." : "Proposition IA"}
                  </Button>
                )}
              </div>
              {loadingCopy ? (
                <div className="flex min-h-32 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" />Chargement de la copie...</div>
              ) : !copy ? (
                <p className="py-8 text-center text-sm text-muted-foreground">La copie n’a pas pu être chargée.</p>
              ) : questions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Cet examen ne contient aucune question.</p>
              ) : (
                <form onSubmit={saveCorrection} className="space-y-3">
                  {questions.map((question, index) => {
                    const answer = copy.attempt.answers?.find((item) => String(item.questionId) === String(question.id));
                    const response = answer?.selectedOption ?? answer?.answerText;
                    return (
                      <section key={question.id} className="rounded-lg border border-border px-3 py-3 sm:px-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <h3 className="text-sm font-semibold">{index + 1}. {question.question}</h3>
                          <span className="shrink-0 text-xs text-muted-foreground">Max. {question.points} pt</span>
                        </div>
                        <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
                          <div className="min-w-0 rounded-md bg-muted px-3 py-2">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Réponse de l’étudiant</p>
                            <p className="whitespace-pre-wrap break-words text-sm">{response ? String(response) : <span className="italic text-muted-foreground">Aucune réponse</span>}</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-[100px_minmax(0,1fr)]">
                            <label className="text-xs font-medium">
                              Points / {question.points}
                              <input
                                className="input-field mt-1 h-9 w-full"
                                type="number"
                                min="0"
                                max={question.points}
                                step="0.01"
                                required
                                value={grades[question.id]?.pointsObtained ?? ""}
                                onChange={(event) => updateGrade(question.id, "pointsObtained", event.target.value)}
                              />
                            </label>
                            <label className="text-xs font-medium">
                              Commentaire facultatif
                              <textarea
                                className="input-field mt-1 min-h-9 w-full resize-y py-2 text-sm"
                                value={grades[question.id]?.feedback ?? ""}
                                onChange={(event) => updateGrade(question.id, "feedback", event.target.value)}
                                placeholder="Commentaire pour l’étudiant..."
                              />
                              {aiRationales[question.id] && (
                                <span className="mt-1 block rounded-md bg-primary-soft/60 p-2 text-xs font-normal text-muted-foreground">
                                  Justification IA : {aiRationales[question.id]}
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                  <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 py-3 backdrop-blur">
                    <p className="text-sm font-semibold text-primary">
                      Total : {questions.reduce((sum, question) => sum + (Number(grades[question.id]?.pointsObtained) || 0), 0)} / {questions.reduce((sum, question) => sum + Number(question.points || 0), 0)}
                    </p>
                    <div className="ml-auto flex flex-wrap justify-end gap-2">
                      <Button type="submit" disabled={!allQuestionsScored || saving || generatingAi}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {saving ? "Enregistrement..." : hasAiSuggestion ? "Confirmer et publier la correction" : copy.attempt.status === "GRADED" ? "Mettre à jour la correction" : "Enregistrer la correction"}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
              </>
            )}
          </section>
          
        </div>
      )}
    </TeacherShell>
  );
}
