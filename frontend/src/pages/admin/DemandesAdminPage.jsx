import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import apiFetch from "@/utils/api";

export default function DemandesAdminPage() {
  const [requests, setRequests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [targetOrganizationId, setTargetOrganizationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const [response, organizationResponse] = await Promise.all([
        apiFetch("/auth/super-admin/pending-admin-requests?page=0&limit=50"),
        apiFetch("/auth/super-admin/organizations"),
      ]);
      setRequests(response?.data?.data || []);
      const availableOrganizations = organizationResponse?.data || [];
      setOrganizations(availableOrganizations);
      setTargetOrganizationId((current) => current || String(availableOrganizations.find((item) => !item.isLegacy)?.id || ""));
    } catch (loadError) {
      setError(loadError.message || "Impossible de charger les demandes d’administrateur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function decide(request, approve) {
    setBusyId(request.id);
    setError("");
    setFeedback("");
    try {
      await apiFetch(`/auth/super-admin/${approve ? "approve" : "reject"}-admin-request/${request.id}`, {
        method: "POST",
        body: {},
      });
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setFeedback(approve
        ? `Le compte de ${request.firstName} ${request.lastName} est approuvé.`
        : `La demande de ${request.firstName} ${request.lastName} est rejetée.`);
    } catch (decisionError) {
      setError(decisionError.message || "Impossible de traiter cette demande.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Demandes de comptes administrateur" description="Examinez les demandes et approuvez uniquement les comptes qui doivent gérer un établissement.">
        <div className="space-y-4">
          {error && <div className="flex items-start gap-2 rounded-lg bg-error-soft p-3 text-sm text-error" role="alert"><AlertTriangle className="size-4 shrink-0" />{error}</div>}
          {feedback && <div className="flex items-start gap-2 rounded-lg bg-success-soft p-3 text-sm text-success" role="status"><CheckCircle2 className="size-4 shrink-0" />{feedback}</div>}
          {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement des demandes…</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <ShieldCheck className="mx-auto mb-3 size-8" />
            Aucune demande de compte administrateur en attente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Demandeur</th>
                  <th className="px-3 py-3 font-medium">Établissement</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 text-right font-medium">Décision</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-4">
                      <p className="font-medium">{request.firstName} {request.lastName}</p>
                      <p className="text-xs text-muted-foreground">{request.email}</p>
                    </td>
                    <td className="px-3 py-4">{request.organization?.name || "Établissement inconnu"}</td>
                    <td className="px-3 py-4 text-muted-foreground">{new Date(request.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={busyId === request.id} onClick={() => decide(request, true)}>
                          {busyId === request.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                          Approuver
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyId === request.id} onClick={() => decide(request, false)}>
                          <XCircle className="size-4" />
                          Refuser
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </SectionCard>
      <SectionCard title="Rattacher les anciennes données" description="Les comptes et données antérieurs à l'isolation restent réservés au super-administrateur jusqu'à leur rattachement. Cette opération déplace tout l'espace historique vers un seul établissement.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2 text-sm font-medium">
            Établissement de destination
            <select className="input-field w-full" value={targetOrganizationId} onChange={(event) => setTargetOrganizationId(event.target.value)}>
              <option value="">Choisir un établissement</option>
              {organizations.filter((item) => !item.isLegacy).map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={!targetOrganizationId || transferring}
            onClick={async () => {
              if (!window.confirm("Rattacher tous les comptes et toutes les données de l'espace historique à cet établissement ?")) return;
              setTransferring(true);
              setError("");
              setFeedback("");
              try {
                const result = await apiFetch("/auth/super-admin/transfer-legacy", {
                  method: "POST",
                  body: { organizationId: Number(targetOrganizationId) },
                });
                setFeedback(`Les données historiques sont rattachées à ${result?.data?.target}.`);
              } catch (transferError) {
                setError(transferError.message || "Impossible de rattacher les données historiques.");
              } finally {
                setTransferring(false);
              }
            }}
          >
            {transferring ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Rattacher les données historiques
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
