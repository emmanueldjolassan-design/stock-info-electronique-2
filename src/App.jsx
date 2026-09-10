import React, { useState, useEffect, useMemo } from "react";
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
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

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

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n || 0) + " F";

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

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard({ produits, ventes, mouvements }) {
  const valeurStock = produits.reduce((s, p) => s + p.stock * p.prix_achat, 0);
  const lowStock = produits.filter((p) => p.stock <= p.seuil_alerte);
  const today = new Date().toISOString().slice(0, 10);
  const ventesJour = ventes.filter((v) => v.created_at?.slice(0, 10) === today).reduce((s, v) => s + v.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Valeur du stock</div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(valeurStock)}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Ventes du jour</div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(ventesJour)}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--warn)" }}>
          <div className="text-xs mb-2 flex items-center gap-1.5" style={{ color: "var(--warn)" }}><AlertTriangle size={13} /> Références sous seuil</div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-mono)", color: "var(--warn)" }}>{lowStock.length}</div>
        </div>
      </div>

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
              <div className="text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{fmt(v.total)}</div>
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
  const [prixAchat, setPrixAchat] = useState(initial?.prix_achat ?? 0);
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
      prix_achat: Number(prixAchat),
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
          <div className="space-y-1"><label className="text-xs" style={{ color: "var(--text-dim)" }}>Prix d'achat</label><input type="number" min="0" className={field} style={fieldStyle} value={prixAchat} onChange={(e) => setPrixAchat(e.target.value)} /></div>
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
  const countFor = (id) => produits.filter((p) => p.categorie_id === id).length;

  const handleAdd = async () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.nom.toLowerCase() === trimmed.toLowerCase())) { setError("Cette catégorie existe déjà."); return; }
    const result = await onAdd(trimmed);
    if (result === null) { setError("Erreur lors de l'ajout."); return; }
    setNewCat(""); setError("");
  };

  const handleDelete = async (cat) => {
    if (countFor(cat.id) > 0) { setError(`Impossible de supprimer "${cat.nom}" : des produits y sont encore rattachés.`); return; }
    await onDelete(cat.id);
    setError("");
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
              <button onClick={() => handleDelete(c)} style={{ color: "var(--text-dim)" }}><Trash2 size={14} /></button>
            </div>
          ))}
          {categories.length === 0 && <div className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>Aucune catégorie pour le moment.</div>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------------

function Produits({ produits, categories, onSaveProduct, onDeleteProduct, onAddCategory, onDeleteCategory }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Tous");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);

  const filtered = produits.filter((p) => (cat === "Tous" || p.categorie_nom === cat) && (p.nom.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="space-y-4">
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
                <td className="px-4 py-2.5 text-right tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(p.prix_vente)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditing(p); setFormOpen(true); }} style={{ color: "var(--text-dim)" }}><Pencil size={14} /></button>
                    <button onClick={() => onDeleteProduct(p.id)} style={{ color: "var(--text-dim)" }}><Trash2 size={14} /></button>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ventes
// ---------------------------------------------------------------------------

function Ventes({ produits, onCheckout }) {
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
                  <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{fmt(p.prix_vente)}</span>
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
                  <div className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{fmt(l.prix)} / unité</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQte(l.id, -1)} className="p-1 rounded" style={{ background: "var(--surface-raised)", color: "var(--text)" }}><Minus size={13} /></button>
                  <span className="w-6 text-center text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{l.qte}</span>
                  <button onClick={() => updateQte(l.id, 1)} className="p-1 rounded" style={{ background: "var(--surface-raised)", color: "var(--text)" }}><Plus size={13} /></button>
                </div>
                <div className="w-24 text-right text-sm tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmt(l.qte * l.prix)}</div>
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
          <div className="flex items-center justify-between"><span className="text-sm" style={{ color: "var(--text)" }}>Total</span><span className="text-xl tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{fmt(total)}</span></div>
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
// App shell
// ---------------------------------------------------------------------------

function MainApp({ session }) {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [produits, setProduits] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [mouvements, setMouvements] = useState([]);

  const fetchAll = async () => {
    const [{ data: cats }, { data: prods }, { data: vts }, { data: mvts }] = await Promise.all([
      supabase.from("categories").select("*").order("nom"),
      supabase.from("produits").select("*, categorie:categories(nom)").order("nom"),
      supabase.from("ventes").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("mouvements_stock").select("*, produit:produits(nom)").order("created_at", { ascending: false }).limit(30),
    ]);
    setCategories(cats || []);
    setProduits((prods || []).map((p) => ({ ...p, categorie_nom: p.categorie?.nom || "—" })));
    setVentes(vts || []);
    setMouvements((mvts || []).map((m) => ({ ...m, produit_nom: m.produit?.nom || m.produit_id })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

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
      const { id, stock, ...rest } = product;
      await supabase.from("produits").update(rest).eq("id", id);
    } else {
      await supabase.from("produits").insert(product);
    }
    await fetchAll();
  };

  const deleteProduct = async (id) => {
    await supabase.from("produits").delete().eq("id", id);
    await fetchAll();
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
  };

  return (
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
