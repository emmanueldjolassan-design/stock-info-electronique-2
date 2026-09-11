import React, { useState, useEffect, useMemo, useContext, createContext } from "react";
import {
  LayoutGrid,
  Boxes,
  Receipt,
  ArrowLeftRight,
  Search,
  Plus,
  Minus,
  Trash2,
  Pencil,
  AlertTriangle,
  PackageX,
  Download,
  BarChart3,
  Settings as SettingsIcon,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "./lib/supabaseClient";

const SettingsContext = createContext({ devise: "F" });

const THEME = {
  "--bg": "#12141A",
  "--surface": "#181B22",
  "--surface-raised": "#20242C",
  "--line": "#2A2E38",
  "--text": "#E7E9EE",
  "--text-dim": "#8A8F9C",
  "--accent": "#4FA3FF",
  "--warn": "#E3A542",
  "--warn-dim": "rgba(227,165,66,0.14)",
  "--ok": "#4FC98A",
  "--ok-dim": "rgba(79,201,138,0.12)",
  "--danger": "#E35C5C",
  "--danger-dim": "rgba(227,92,92,0.14)",
  "--font-mono": "'JetBrains Mono', ui-monospace, monospace",
};

const PREFIXES = {
  Ordinateurs: "PC",
  Imprimantes: "IMP",
  Cartouches: "CAR",
  Papier: "PAP",
  RAM: "RAM",
  Périphériques: "PER",
};

const fmt = (n, devise = "F") => new Intl.NumberFormat("fr-FR").format(n || 0) + " " + devise;

function nextProductId(produits, categorieNom) {
  const prefix = PREFIXES[categorieNom] || categorieNom.slice(0, 3).toUpperCase();
  const existing = produits
    .filter((p) => p.id.startsWith(prefix + "-"))
    .map((p) => parseInt(p.id.split("-")[1], 10))
    .filter((n) => !isNaN(n));
  const next = (existing.length ? Math.max(...existing) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Email ou mot de passe incorrect.");
  };

  const field = "w-full px-3 py-2.5 rounded-md text-sm outline-none";
  const fieldStyle = { background: "var(--surface-raised)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <div style={{ ...THEME, background: "var(--bg)", minHeight: "100vh" }} className="flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg p-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <div>
          <div className="text-base" style={{ color: "var(--text)" }}>Stock Info & Électronique</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Connexion au compte du magasin</div>
        </div>
        <input className={field} style={fieldStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={field} style={fieldStyle} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="text-xs px-3 py-2 rounded-md" style={{ background: "var(--warn-dim)", color: "var(--warn)" }}>{error}</div>}
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-md text-sm flex items-center justify-center gap-2" style={{ background: "var(--accent)", color: "#0B0D11" }}>
          {loading && <Loader2 size={14} className="animate-spin" />}
          Se connecter
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function StockBar({ stock, seuil }) {
  const ratio = Math.min(stock / (seuil * 2.5 || 1), 1);
  const low = stock <= seuil;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(ratio * 100, 6)}%`, background: low ? "var(--warn)" : "var(--accent)" }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color: low ? "var(--warn)" : "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{stock}</span>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors" style={{ background: active ? "var(--surface-raised)" : "transparent", color: active ? "var(--text)" : "var(--text-dim)" }}>
      <Icon size={17} strokeWidth={1.75} />
      <span className="flex-1 text-left">{label}</span>
      {badge ? <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--warn-dim)", color: "var(--warn)", fontFamily: "var(--font-mono)" }}>{badge}</span> : null}
    </button>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-16" style={{ color: "var(--text-dim)" }}>
      <Loader2 size={18} className="animate-spin" />
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel = "Supprimer", onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(8,9,12,0.65)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm rounded-t-lg sm:rounded-lg p-5 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--danger)" }}>
        <div className="flex items-center gap-2" style={{ color: "var(--danger)" }}>
          <AlertTriangle size={17} />
          <div className="text-sm" style={{ color: "var(--text)" }}>{title}</div>
        </div>
        <div className="text-sm" style={{ color: "var(--text-dim)" }}>{message}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-md text-sm" style={{ background: "var(--surface-raised)", border: "1px solid var(--line)", color: "var(--text)" }}>Annuler</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 py-2.5 rounded-md text-sm flex items-center justify-center gap-2" style={{ background: "var(--danger)", color: "#fff" }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard({ produits, ventes, mouvements }) {
  const { devise } = useContext(SettingsContext);
  const valeurStock = produits.reduce((s, p) => s + p.stock * p.prix_vente, 0);
  const lowStock = produits.filter((p) => p.stock > 0 && p.stock <= p.seuil_alerte);
  const ruptures = produits.filter((p) => p.stock <= 0);
  const today = new Date().toISOString().slice(0, 10);
  const ventesJour = ventes.filter((v) => v.created_at?.slice(0, 10) === today).reduce((s, v) => s + v.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Valeur du stock</div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(valeurStock, devise)}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Ventes du jour</div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(ventesJour, devise)}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--warn)" }}>
          <div className="text-xs mb-2 flex items-center gap-1.5" style={{ color: "var(--warn)" }}><AlertTriangle size={13} /> Sous seuil</div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--warn)" }}>{lowStock.length}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--danger)" }}>
          <div className="text-xs mb-2 flex items-center gap-1.5" style={{ color: "var(--danger)" }}><PackageX size={13} /> En rupture</div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>{ruptures.length}</div>
        </div>
      </div>

      {ruptures.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--danger)" }}>
          <div className="px-4 py-3 text-sm flex items-center gap-2" style={{ background: "var(--danger-dim)", color: "var(--danger)", borderBottom: "1px solid var(--line)" }}>
            <PackageX size={14} /> Produits en rupture de stock
          </div>
          {ruptures.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <div>
                <div className="text-sm" style={{ color: "var(--text)" }}>{p.nom}</div>
                <div className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{p.id}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--danger-dim)", color: "var(--danger)", fontFamily: "var(--font-mono)" }}>0 en stock</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <div className="px-4 py-3 text-sm" style={{ background: "var(--surface)", color: "var(--text)", borderBottom: "1px solid var(--line)" }}>Alertes stock bas</div>
        {lowStock.length === 0 && <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucune alerte pour le moment.</div>}
        {lowStock.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <div className="text-sm" style={{ color: "var(--text)" }}>{p.nom}</div>
              <div className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{p.id}</div>
            </div>
            <StockBar stock={p.stock} seuil={p.seuil_alerte} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <div className="px-4 py-3 text-sm" style={{ background: "var(--surface)", color: "var(--text)", borderBottom: "1px solid var(--line)" }}>Ventes récentes</div>
          {ventes.length === 0 && <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucune vente enregistrée.</div>}
          {ventes.slice(0, 6).map((v) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <div>
                <div className="text-sm" style={{ color: "var(--text)" }}>{v.client || "Client comptoir"}</div>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>{new Date(v.created_at).toLocaleDateString("fr-FR")} · <span style={{ fontFamily: "var(--font-mono)" }}>{v.numero}</span></div>
              </div>
              <div className="text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{fmt(v.total, devise)}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <div className="px-4 py-3 text-sm" style={{ background: "var(--surface)", color: "var(--text)", borderBottom: "1px solid var(--line)" }}>Derniers mouvements</div>
          {mouvements.length === 0 && <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucun mouvement enregistré.</div>}
          {mouvements.slice(0, 6).map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <div>
                <div className="text-sm" style={{ color: "var(--text)" }}>{m.produit_nom}</div>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>{new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="text-xs px-2 py-1 rounded" style={{ fontFamily: "var(--font-mono)", color: m.type === "entree" ? "var(--ok)" : "var(--text-dim)", background: m.type === "entree" ? "var(--ok-dim)" : "var(--surface-raised)" }}>
                {m.type === "entree" ? "+" : "−"}{m.quantite}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaire produit
// ---------------------------------------------------------------------------

function ProductForm({ initial, categories, produits, onAddCategory, onSave, onClose }) {
  const isEdit = Boolean(initial);
  const [nom, setNom] = useState(initial?.nom || "");
  const [categorieId, setCategorieId] = useState(initial?.categorie_id || categories[0]?.id || "");
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [seuil, setSeuil] = useState(initial?.seuil_alerte ?? 5);
  const [prixVente, setPrixVente] = useState(initial?.prix_vente ?? 0);
  const [saving, setSaving] = useState(false);

  const confirmNewCategory = async () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    const created = await onAddCategory(trimmed);
    if (created) setCategorieId(created.id);
    setNewCat("");
    setAddingCat(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !categorieId) return;
    setSaving(true);
    const categorieNom = categories.find((c) => c.id === categorieId)?.nom || "";
    const product = {
      id: initial?.id || nextProductId(produits, categorieNom),
      nom: nom.trim(),
      categorie_id: categorieId,
      stock: Number(stock),
      seuil_alerte: Number(seuil),
      prix_vente: Number(prixVente),
    };
    await onSave(product, isEdit);
    setSaving(false);
  };

  const field = "w-full px-3 py-2 rounded-md text-sm outline-none";
  const fieldStyle = { background: "var(--surface-raised)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(8,9,12,0.6)" }} onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full sm:max-w-md rounded-t-lg sm:rounded-lg p-5 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: "var(--text)" }}>{isEdit ? "Modifier le produit" : "Nouveau produit"}</div>
          <button type="button" onClick={onClose} style={{ color: "var(--text-dim)" }}><X size={16} /></button>
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--text-dim)" }}>Nom du produit</label>
          <input className={field} style={fieldStyle} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Imprimante LaserJet M110" autoFocus />
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--text-dim)" }}>Catégorie</label>
          {!addingCat ? (
            <div className="flex gap-2">
              <select className={field} style={fieldStyle} value={categorieId} onChange={(e) => setCategorieId(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <button type="button" onClick={() => setAddingCat(true)} className="px-3 rounded-md text-sm shrink-0" style={{ background: "var(--surface-raised)", border: "1px solid var(--line)", color: "var(--text)" }}>+ Cat.</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input className={field} style={fieldStyle} value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nom de la nouvelle catégorie" autoFocus />
              <button type="button" onClick={confirmNewCategory} className="px-3 rounded-md text-sm shrink-0" style={{ background: "var(--accent)", color: "#0B0D11" }}>Ok</button>
              <button type="button" onClick={() => setAddingCat(false)} className="px-2 rounded-md text-sm shrink-0" style={{ color: "var(--text-dim)" }}><X size={14} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><label className="text-xs" style={{ color: "var(--text-dim)" }}>Stock initial</label><input type="number" min="0" className={field} style={fieldStyle} value={stock} onChange={(e) => setStock(e.target.value)} disabled={isEdit} /></div>
          <div className="space-y-1"><label className="text-xs" style={{ color: "var(--text-dim)" }}>Seuil d'alerte</label><input type="number" min="0" className={field} style={fieldStyle} value={seuil} onChange={(e) => setSeuil(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs" style={{ color: "var(--text-dim)" }}>Prix de vente</label><input type="number" min="0" className={field} style={fieldStyle} value={prixVente} onChange={(e) => setPrixVente(e.target.value)} /></div>
        </div>
        {isEdit && <div className="text-xs" style={{ color: "var(--text-dim)" }}>Le stock se modifie via les mouvements (entrées/sorties), pas ici.</div>}

        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-md text-sm flex items-center justify-center gap-2" style={{ background: "var(--accent)", color: "#0B0D11" }}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Enregistrer les modifications" : "Ajouter le produit"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gestion des catégories
// ---------------------------------------------------------------------------

function CategoryManager({ categories, produits, onAdd, onDelete, onClose }) {
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const countFor = (id) => produits.filter((p) => p.categorie_id === id).length;

  const handleAdd = async () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.nom.toLowerCase() === trimmed.toLowerCase())) { setError("Cette catégorie existe déjà."); return; }
    const result = await onAdd(trimmed);
    if (result === null) { setError("Erreur lors de l'ajout."); return; }
    setNewCat(""); setError("");
  };

  const requestDelete = (cat) => {
    if (countFor(cat.id) > 0) { setError(`Impossible de supprimer "${cat.nom}" : ${countFor(cat.id)} produit(s) y sont encore rattachés.`); return; }
    setError("");
    setToDelete(cat);
  };

  const confirmDelete = async () => {
    await onDelete(toDelete.id);
    setToDelete(null);
  };

  const field = "w-full px-3 py-2 rounded-md text-sm outline-none";
  const fieldStyle = { background: "var(--surface-raised)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(8,9,12,0.6)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-lg sm:rounded-lg p-5 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: "var(--text)" }}>Catégories</div>
          <button type="button" onClick={onClose} style={{ color: "var(--text-dim)" }}><X size={16} /></button>
        </div>
        <div className="flex gap-2">
          <input className={field} style={fieldStyle} value={newCat} onChange={(e) => { setNewCat(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())} placeholder="Nouvelle catégorie…" />
          <button type="button" onClick={handleAdd} className="flex items-center gap-1.5 px-3 rounded-md text-sm shrink-0" style={{ background: "var(--accent)", color: "#0B0D11" }}><Plus size={14} /> Ajouter</button>
        </div>
        {error && <div className="text-xs px-3 py-2 rounded-md" style={{ background: "var(--warn-dim)", color: "var(--warn)" }}>{error}</div>}
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <div>
                <div className="text-sm" style={{ color: "var(--text)" }}>{c.nom}</div>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>{countFor(c.id)} produit{countFor(c.id) > 1 ? "s" : ""}</div>
              </div>
              <button onClick={() => requestDelete(c)} style={{ color: "var(--text-dim)" }}><Trash2 size={14} /></button>
            </div>
          ))}
          {categories.length === 0 && <div className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucune catégorie pour le moment.</div>}
        </div>
      </div>
      {toDelete && (
        <ConfirmDialog
          title="Supprimer cette catégorie ?"
          message={`La catégorie "${toDelete.nom}" sera définitivement supprimée. Cette action est irréversible.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------------

function Produits({ produits, categories, onSaveProduct, onDeleteProduct, onAddCategory, onDeleteCategory }) {
  const { devise } = useContext(SettingsContext);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Tous");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const filtered = produits.filter((p) => (cat === "Tous" || p.categorie_nom === cat) && (p.nom.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())));

  const confirmDelete = async () => {
    const result = await onDeleteProduct(toDelete.id);
    if (result?.error) setDeleteError(result.error);
    setToDelete(null);
  };

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="text-xs px-3 py-2 rounded-md flex items-center justify-between" style={{ background: "var(--danger-dim)", color: "var(--danger)" }}>
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError("")}><X size={13} /></button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md flex-1" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <Search size={15} style={{ color: "var(--text-dim)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit ou une référence…" className="bg-transparent outline-none text-sm flex-1" style={{ color: "var(--text)" }} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-3 py-2 rounded-md text-sm outline-none" style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--text)" }}>
          <option>Tous</option>
          {categories.map((c) => <option key={c.id}>{c.nom}</option>)}
        </select>
        <button onClick={() => setCatManagerOpen(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm shrink-0" style={{ background: "var(--surface-raised)", border: "1px solid var(--line)", color: "var(--text)" }}><Boxes size={15} /> Catégories</button>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm shrink-0" style={{ background: "var(--accent)", color: "#0B0D11" }}><Plus size={15} /> Nouveau produit</button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
              <th className="text-left font-normal px-4 py-2.5" style={{ color: "var(--text-dim)" }}>Référence</th>
              <th className="text-left font-normal px-4 py-2.5" style={{ color: "var(--text-dim)" }}>Produit</th>
              <th className="text-left font-normal px-4 py-2.5 hidden sm:table-cell" style={{ color: "var(--text-dim)" }}>Catégorie</th>
              <th className="text-left font-normal px-4 py-2.5" style={{ color: "var(--text-dim)" }}>Stock</th>
              <th className="text-right font-normal px-4 py-2.5" style={{ color: "var(--text-dim)" }}>Prix vente</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td className="px-4 py-2.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{p.id}</td>
                <td className="px-4 py-2.5" style={{ color: "var(--text)" }}>{p.nom}</td>
                <td className="px-4 py-2.5 hidden sm:table-cell" style={{ color: "var(--text-dim)" }}>{p.categorie_nom}</td>
                <td className="px-4 py-2.5"><StockBar stock={p.stock} seuil={p.seuil_alerte} /></td>
                <td className="px-4 py-2.5 text-right tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(p.prix_vente, devise)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditing(p); setFormOpen(true); }} style={{ color: "var(--text-dim)" }}><Pencil size={14} /></button>
                    <button onClick={() => setToDelete(p)} style={{ color: "var(--text-dim)" }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucun produit ne correspond à la recherche.</td></tr>}
          </tbody>
        </table>
      </div>

      {formOpen && <ProductForm initial={editing} categories={categories} produits={produits} onAddCategory={onAddCategory} onSave={async (p, isEdit) => { await onSaveProduct(p, isEdit); setFormOpen(false); }} onClose={() => setFormOpen(false)} />}
      {catManagerOpen && <CategoryManager categories={categories} produits={produits} onAdd={onAddCategory} onDelete={onDeleteCategory} onClose={() => setCatManagerOpen(false)} />}
      {toDelete && (
        <ConfirmDialog
          title="Supprimer ce produit ?"
          message={`"${toDelete.nom}" sera retiré de tes listes. Si des ventes y sont liées, il sera archivé plutôt que supprimé définitivement, pour garder ton historique intact.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ventes
// ---------------------------------------------------------------------------

function Ventes({ produits, onCheckout }) {
  const { devise } = useContext(SettingsContext);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const results = query ? produits.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())) : [];

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) return prev.map((l) => (l.id === product.id ? { ...l, qte: l.qte + 1 } : l));
      return [...prev, { id: product.id, nom: product.nom, prix: product.prix_vente, qte: 1 }];
    });
    setQuery("");
  };

  const updateQte = (id, delta) => setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qte: Math.max(1, l.qte + delta) } : l)).filter((l) => l.qte > 0));
  const removeLine = (id) => setCart((prev) => prev.filter((l) => l.id !== id));
  const total = cart.reduce((s, l) => s + l.qte * l.prix, 0);

  const handleCheckout = async () => {
    setSubmitting(true);
    await onCheckout(cart, total);
    setCart([]);
    setSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md relative" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <Search size={15} style={{ color: "var(--text-dim)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ajouter un produit à la facture…" className="bg-transparent outline-none text-sm flex-1" style={{ color: "var(--text)" }} />
          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-md overflow-hidden z-10" style={{ background: "var(--surface-raised)", border: "1px solid var(--line)" }}>
              {results.slice(0, 6).map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} className="flex items-center justify-between w-full px-3 py-2 text-sm text-left" style={{ borderBottom: "1px solid var(--line)", color: "var(--text)" }}>
                  <span>{p.nom} {p.stock <= 0 && <span style={{ color: "var(--warn)" }}>(rupture)</span>}</span>
                  <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{fmt(p.prix_vente, devise)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          {cart.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucun article ajouté. Recherchez un produit ci-dessus pour commencer une facture.</div>
          ) : (
            cart.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
                <div className="flex-1">
                  <div className="text-sm" style={{ color: "var(--text)" }}>{l.nom}</div>
                  <div className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{fmt(l.prix, devise)} / unité</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQte(l.id, -1)} className="p-1 rounded" style={{ background: "var(--surface-raised)", color: "var(--text)" }}><Minus size={13} /></button>
                  <span className="w-6 text-center text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{l.qte}</span>
                  <button onClick={() => updateQte(l.id, 1)} className="p-1 rounded" style={{ background: "var(--surface-raised)", color: "var(--text)" }}><Plus size={13} /></button>
                </div>
                <div className="w-24 text-right text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(l.qte * l.prix, devise)}</div>
                <button onClick={() => removeLine(l.id)} style={{ color: "var(--text-dim)" }}><Trash2 size={14} /></button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-lg p-4 space-y-4 sticky top-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <div className="text-sm" style={{ color: "var(--text-dim)" }}>Récapitulatif</div>
          <div className="flex items-center justify-between"><span className="text-sm" style={{ color: "var(--text-dim)" }}>Articles</span><span className="text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{cart.reduce((s, l) => s + l.qte, 0)}</span></div>
          <div className="h-px" style={{ background: "var(--line)" }} />
          <div className="flex items-center justify-between"><span className="text-sm" style={{ color: "var(--text)" }}>Total</span><span className="text-xl tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{fmt(total, devise)}</span></div>
          <button disabled={cart.length === 0 || submitting} onClick={handleCheckout} className="w-full py-2.5 rounded-md text-sm flex items-center justify-center gap-2" style={{ background: cart.length === 0 ? "var(--surface-raised)" : "var(--accent)", color: cart.length === 0 ? "var(--text-dim)" : "#0B0D11", opacity: cart.length === 0 ? 0.6 : 1 }}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Encaisser la facture
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mouvements
// ---------------------------------------------------------------------------

function Mouvements({ mouvements }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
            <th className="text-left font-normal px-4 py-2.5" style={{ color: "var(--text-dim)" }}>Date</th>
            <th className="text-left font-normal px-4 py-2.5" style={{ color: "var(--text-dim)" }}>Produit</th>
            <th className="text-left font-normal px-4 py-2.5 hidden sm:table-cell" style={{ color: "var(--text-dim)" }}>Référence</th>
            <th className="text-right font-normal px-4 py-2.5" style={{ color: "var(--text-dim)" }}>Quantité</th>
          </tr>
        </thead>
        <tbody>
          {mouvements.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid var(--line)" }}>
              <td className="px-4 py-2.5" style={{ color: "var(--text-dim)" }}>{new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
              <td className="px-4 py-2.5" style={{ color: "var(--text)" }}>{m.produit_nom}</td>
              <td className="px-4 py-2.5 hidden sm:table-cell" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{m.reference || "—"}</td>
              <td className="px-4 py-2.5 text-right tabular-nums" style={{ fontFamily: "var(--font-mono)", color: m.type === "entree" ? "var(--ok)" : "var(--text)" }}>{m.type === "entree" ? "+" : "−"}{m.quantite}</td>
            </tr>
          ))}
          {mouvements.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucun mouvement enregistré.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rapports
// ---------------------------------------------------------------------------

const PERIODES = {
  jour: { label: "Aujourd'hui", jours: 0 },
  semaine: { label: "7 derniers jours", jours: 7 },
  mois: { label: "30 derniers jours", jours: 30 },
};

function Rapports() {
  const { devise } = useContext(SettingsContext);
  const [periode, setPeriode] = useState("semaine");
  const [loading, setLoading] = useState(true);
  const [ventes, setVentes] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const start = new Date();
      start.setDate(start.getDate() - PERIODES[periode].jours);
      start.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("ventes")
        .select("*, ventes_lignes(*, produit:produits(nom))")
        .gte("created_at", start.toISOString())
        .order("created_at", { ascending: false });

      setVentes(data || []);
      setLoading(false);
    };
    fetchReport();
  }, [periode]);

  const totalRevenue = ventes.reduce((s, v) => s + v.total, 0);
  const nbVentes = ventes.length;
  const panierMoyen = nbVentes > 0 ? totalRevenue / nbVentes : 0;

  const topProduits = useMemo(() => {
    const map = {};
    ventes.forEach((v) => {
      (v.ventes_lignes || []).forEach((l) => {
        const nom = l.produit?.nom || l.produit_id;
        if (!map[nom]) map[nom] = { nom, quantite: 0, total: 0 };
        map[nom].quantite += l.quantite;
        map[nom].total += l.quantite * l.prix_unitaire;
      });
    });
    return Object.values(map).sort((a, b) => b.quantite - a.quantite);
  }, [ventes]);

  const exportExcel = () => {
    const wsVentes = XLSX.utils.json_to_sheet(
      ventes.map((v) => ({
        Numéro: v.numero,
        Date: new Date(v.created_at).toLocaleString("fr-FR"),
        Client: v.client || "Client comptoir",
        Total: v.total,
      }))
    );
    const wsProduits = XLSX.utils.json_to_sheet(
      topProduits.map((p) => ({ Produit: p.nom, "Quantité vendue": p.quantite, "Chiffre d'affaires": p.total }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsVentes, "Ventes");
    XLSX.utils.book_append_sheet(wb, wsProduits, "Produits");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `rapport-${periode}-${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex gap-1 rounded-md p-1" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          {Object.entries(PERIODES).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setPeriode(key)}
              className="px-3 py-1.5 rounded text-sm"
              style={{ background: periode === key ? "var(--surface-raised)" : "transparent", color: periode === key ? "var(--text)" : "var(--text-dim)" }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportExcel}
          disabled={ventes.length === 0}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm shrink-0"
          style={{ background: ventes.length === 0 ? "var(--surface-raised)" : "var(--accent)", color: ventes.length === 0 ? "var(--text-dim)" : "#0B0D11", opacity: ventes.length === 0 ? 0.6 : 1 }}
        >
          <Download size={15} /> Exporter en Excel
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Chiffre d'affaires</div>
              <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(totalRevenue, devise)}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Nombre de ventes</div>
              <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{nbVentes}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Panier moyen</div>
              <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(panierMoyen, devise)}</div>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="px-4 py-3 text-sm" style={{ background: "var(--surface)", color: "var(--text)", borderBottom: "1px solid var(--line)" }}>Produits les plus vendus</div>
            {topProduits.length === 0 && <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucune vente sur cette période.</div>}
            {topProduits.slice(0, 10).map((p) => (
              <div key={p.nom} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
                <div className="text-sm" style={{ color: "var(--text)" }}>{p.nom}</div>
                <div className="flex items-center gap-4">
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>× {p.quantite}</span>
                  <span className="text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{fmt(p.total, devise)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paramètres
// ---------------------------------------------------------------------------

const DEVISES = ["F", "FCFA", "€", "$", "£"];

function Parametres({ devise, onSaveDevise }) {
  const [value, setValue] = useState(devise);
  const [custom, setCustom] = useState(!DEVISES.includes(devise));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSaveDevise(value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <div>
          <div className="text-sm" style={{ color: "var(--text)" }}>Devise</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>Utilisée pour tous les montants affichés dans l'app.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEVISES.map((d) => (
            <button
              key={d}
              onClick={() => { setValue(d); setCustom(false); }}
              className="px-3 py-1.5 rounded-md text-sm"
              style={{ background: !custom && value === d ? "var(--accent)" : "var(--surface-raised)", color: !custom && value === d ? "#0B0D11" : "var(--text)", border: "1px solid var(--line)" }}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setCustom(true)}
            className="px-3 py-1.5 rounded-md text-sm"
            style={{ background: custom ? "var(--accent)" : "var(--surface-raised)", color: custom ? "#0B0D11" : "var(--text)", border: "1px solid var(--line)" }}
          >
            Autre…
          </button>
        </div>
        {custom && (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex. XOF, R, CFA…"
            className="w-full px-3 py-2 rounded-md text-sm outline-none"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--line)", color: "var(--text)" }}
          />
        )}
        <button onClick={handleSave} disabled={saving || !value.trim()} className="w-full py-2.5 rounded-md text-sm flex items-center justify-center gap-2" style={{ background: "var(--accent)", color: "#0B0D11" }}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </div>

      <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <div className="text-sm" style={{ color: "var(--text)" }}>D'autres réglages arriveront ici</div>
        <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Nom du magasin, gestion des accès, etc. — dis-moi ce dont tu as besoin.</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------

function MainApp({ session }) {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [produits, setProduits] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [devise, setDevise] = useState("F");

  const fetchAll = async () => {
    const [{ data: cats }, { data: prods }, { data: vts }, { data: mvts }, { data: params }] = await Promise.all([
      supabase.from("categories").select("*").order("nom"),
      supabase.from("produits").select("*, categorie:categories(nom)").eq("actif", true).order("nom"),
      supabase.from("ventes").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("mouvements_stock").select("*, produit:produits(nom)").order("created_at", { ascending: false }).limit(30),
      supabase.from("parametres").select("*").eq("id", 1).single(),
    ]);
    setCategories(cats || []);
    setProduits((prods || []).map((p) => ({ ...p, categorie_nom: p.categorie?.nom || "—" })));
    setVentes(vts || []);
    setMouvements((mvts || []).map((m) => ({ ...m, produit_nom: m.produit?.nom || m.produit_id })));
    if (params?.devise) setDevise(params.devise);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const saveDevise = async (nouvelleDevise) => {
    await supabase.from("parametres").update({ devise: nouvelleDevise, updated_at: new Date().toISOString() }).eq("id", 1);
    setDevise(nouvelleDevise);
  };

  const addCategory = async (nom) => {
    const { data, error } = await supabase.from("categories").insert({ nom }).select().single();
    if (error) return null;
    await fetchAll();
    return data;
  };

  const deleteCategory = async (id) => {
    await supabase.from("categories").delete().eq("id", id);
    await fetchAll();
  };

  const saveProduct = async (product, isEdit) => {
    if (isEdit) {
      const { id, stock, ...rest } = product; // le stock ne se modifie pas ici
      await supabase.from("produits").update(rest).eq("id", id);
    } else {
      await supabase.from("produits").insert(product);
    }
    await fetchAll();
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase.from("produits").update({ actif: false }).eq("id", id);
    if (error) return { error: "La suppression a échoué. Réessaie ou contacte le support si ça persiste." };
    await fetchAll();
    return { error: null };
  };

  const checkout = async (cart, total) => {
    const lastNum = ventes[0]?.numero;
    const lastN = lastNum ? parseInt(lastNum.split("-")[1], 10) : 0;
    const numero = `V-${String(lastN + 1).padStart(5, "0")}`;

    const { data: vente, error } = await supabase.from("ventes").insert({ numero, total }).select().single();
    if (error || !vente) return;

    await supabase.from("ventes_lignes").insert(cart.map((l) => ({ vente_id: vente.id, produit_id: l.id, quantite: l.qte, prix_unitaire: l.prix })));
    await supabase.from("mouvements_stock").insert(cart.map((l) => ({ produit_id: l.id, type: "sortie", quantite: l.qte, reference: numero })));

    await fetchAll();
  };

  const lowCount = useMemo(() => produits.filter((p) => p.stock <= p.seuil_alerte).length, [produits]);

  const TABS = {
    dashboard: { label: "Tableau de bord", icon: LayoutGrid, component: <Dashboard produits={produits} ventes={ventes} mouvements={mouvements} /> },
    produits: { label: "Produits", icon: Boxes, component: <Produits produits={produits} categories={categories} onSaveProduct={saveProduct} onDeleteProduct={deleteProduct} onAddCategory={addCategory} onDeleteCategory={deleteCategory} /> },
    ventes: { label: "Ventes", icon: Receipt, component: <Ventes produits={produits} onCheckout={checkout} /> },
    mouvements: { label: "Mouvements", icon: ArrowLeftRight, component: <Mouvements mouvements={mouvements} /> },
    rapports: { label: "Rapports", icon: BarChart3, component: <Rapports /> },
    parametres: { label: "Paramètres", icon: SettingsIcon, component: <Parametres devise={devise} onSaveDevise={saveDevise} /> },
  };

  return (
    <SettingsContext.Provider value={{ devise }}>
    <div style={{ ...THEME, background: "var(--bg)", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto">
        <div className="md:w-56 shrink-0 md:min-h-screen px-3 py-4 md:py-6" style={{ borderBottom: "1px solid var(--line)", borderRight: "1px solid var(--line)" }}>
          <div className="px-2 mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: "var(--text)" }}>Stock Info</div>
              <div className="text-xs" style={{ color: "var(--text-dim)" }}>Gestion & ventes</div>
            </div>
            <button onClick={() => supabase.auth.signOut()} title="Déconnexion" style={{ color: "var(--text-dim)" }}><LogOut size={16} /></button>
          </div>
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {Object.entries(TABS).map(([key, t]) => (
              <NavItem key={key} icon={t.icon} label={t.label} active={tab === key} onClick={() => setTab(key)} badge={key === "dashboard" && lowCount > 0 ? lowCount : null} />
            ))}
          </div>
        </div>
        <div className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="mb-5"><div className="text-lg" style={{ color: "var(--text)" }}>{TABS[tab].label}</div></div>
          {loading ? <Loading /> : TABS[tab].component}
        </div>
      </div>
    </div>
    </SettingsContext.Provider>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ ...THEME, background: "var(--bg)", minHeight: "100vh" }} className="flex items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-dim)" }} />
      </div>
    );
  }

  return session ? <MainApp session={session} /> : <Login />;
}
