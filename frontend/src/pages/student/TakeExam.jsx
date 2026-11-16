import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { studentNav } from "./StudentNav";
import { Button } from "@/components/ui/Button";
import apiFetch from "@/utils/api";

export default function TakeExam() {
	const { examId } = useParams();
	const attemptId = new URLSearchParams(useLocation().search).get("attempt");
	const navigate = useNavigate();
	const [attempt, setAttempt] = useState(null);
	const [answers, setAnswers] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(null);
	const [submitting, setSubmitting] = useState(false);
		const [remainingSeconds, setRemainingSeconds] = useState(null);
	const [serverOffset, setServerOffset] = useState(0);

	useEffect(() => {
		if (!attemptId) { setError("Tentative introuvable."); setLoading(false); return; }
		apiFetch(`/exam-attempts/${attemptId}`)
			.then(({ data }) => {
				setAttempt(data);
				if (data?.serverNow) setServerOffset(new Date(data.serverNow).getTime() - Date.now());
				setAnswers(Object.fromEntries((data?.answers || []).map((answer) => [answer.questionId, answer.selectedOption ?? answer.answerText ?? ""])));
			})
			.catch((loadError) => setError(loadError.message || "Impossible de charger l'examen."))
			.finally(() => setLoading(false));
	}, [attemptId]);

	useEffect(() => {
		if (!attempt?.expiresAt || attempt.status !== "IN_PROGRESS") return undefined;
		let submittingAutomatically = false;
		const updateRemaining = async () => {
			const seconds = Math.max(0, Math.ceil((new Date(attempt.expiresAt).getTime() - (Date.now() + serverOffset)) / 1000));
			setRemainingSeconds(seconds);
			if (seconds === 0 && !submittingAutomatically) {
				submittingAutomatically = true;
				try {
					await apiFetch(`/exam-attempts/${attemptId}/submit`, { method: "PATCH" });
					navigate("/etudiant/resultats");
				} catch (submitError) {
					setError(submitError.message || "Impossible de soumettre automatiquement l'examen.");
				}
			}
		};
		updateRemaining();
		const timer = window.setInterval(updateRemaining, 1000);
		return () => window.clearInterval(timer);
	}, [attempt, attemptId, navigate, serverOffset]);

	async function saveAnswer(questionId, value, type) {
		setAnswers((current) => ({ ...current, [questionId]: value }));
		setSaving(questionId);
		try {
			await apiFetch("/exam-answers", { method: "POST", body: { attemptId, questionId, ...(type === "MCQ" ? { selectedOption: value } : { answerText: value }) } });
		} catch (saveError) { setError(saveError.message || "Impossible d'enregistrer la réponse."); }
		finally { setSaving(null); }
	}

	async function submit() {
		setSubmitting(true);
		try { await apiFetch(`/exam-attempts/${attemptId}/submit`, { method: "PATCH" }); navigate("/etudiant/resultats"); }
		catch (submitError) { setError(submitError.message || "Impossible de soumettre l'examen."); setSubmitting(false); }
	}

	if (loading) return <AppShell nav={studentNav} role="étudiant" title="Examen"><div className="flex min-h-48 items-center justify-center"><Loader2 className="mr-2 size-5 animate-spin" />Chargement...</div></AppShell>;
	const questions = attempt?.exam?.questions || [];
	return <AppShell nav={studentNav} role="étudiant" title={attempt?.exam?.title || `Examen ${examId}`} subtitle="Répondez aux questions puis soumettez votre tentative.">
		{error && <div className="mb-5 rounded-xl border border-error/20 bg-error-soft p-4 text-sm text-error" role="alert">{error}</div>}
		{remainingSeconds !== null && <div className="mb-5 flex items-center justify-between rounded-xl border border-warning/20 bg-warning-soft p-4 text-sm text-warning"><span>Temps restant</span><strong>{Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}</strong></div>}
		<div className="space-y-5">{questions.map((question, index) => <section key={question.id} className="rounded-xl border border-border p-5"><p className="font-semibold">{index + 1}. {question.question}</p>{question.type === "MCQ" ? <div className="mt-4 grid gap-2">{(Array.isArray(question.options) ? question.options : []).map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"><input type="radio" name={`question-${question.id}`} checked={answers[question.id] === option} onChange={() => saveAnswer(question.id, option, question.type)} />{option}</label>)}</div> : <textarea className="mt-4 min-h-28 w-full rounded-lg border border-border bg-background p-3" value={answers[question.id] || ""} onChange={(event) => saveAnswer(question.id, event.target.value, question.type)} placeholder="Votre réponse" />}{saving === question.id && <p className="mt-2 text-xs text-muted-foreground">Enregistrement...</p>}</section>)}<Button type="button" onClick={submit} disabled={submitting || attempt?.status !== "IN_PROGRESS"} className="w-full sm:w-auto"><Send className="size-4" />{submitting ? "Soumission..." : "Soumettre l'examen"}</Button></div>
	</AppShell>;
}
