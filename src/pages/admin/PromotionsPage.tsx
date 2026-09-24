import { Edit3, ImagePlus, Power, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Promotion } from "@/types/domain";
import { useCreatePromotionMutation, usePromotionsQuery, useUpdatePromotionMutation } from "@/features/data/queries";
import { EmptyState } from "@/components/common/EmptyState";
import { fileToImageDataUrl } from "@/lib/imageDataUrl";

export function PromotionsPage() {
  const { data: promotions = [] } = usePromotionsQuery();
  const createMutation = useCreatePromotionMutation();
  const updateMutation = useUpdatePromotionMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    setTitle(editing.title);
    setDescription(editing.description);
    setActive(editing.active);
    setImageUrl(editing.imageUrl ?? "");
    setImageName(editing.imageUrl?.startsWith("data:") ? "Imagen guardada" : editing.imageUrl ? "Imagen existente" : "");
    setError("");
  }, [editing]);

  const reset = () => { setEditing(null); setTitle(""); setDescription(""); setActive(true); setImageUrl(""); setImageName(""); setError(""); };

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setImageUrl(await fileToImageDataUrl(file));
      setImageName(file.name);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar la imagen.");
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) { setError("Completa el título y la descripción."); return; }
    const changes = { title: title.trim(), description: description.trim(), active, imageUrl: imageUrl || undefined };
    const options = { onSuccess: reset, onError: () => setError("No fue posible guardar la promoción.") };
    if (editing) updateMutation.mutate({ id: editing.id, changes }, options);
    else createMutation.mutate(changes, options);
  };

  const toggle = (promotion: Promotion) => updateMutation.mutate({ id: promotion.id, changes: { active: !promotion.active } });
  const pending = createMutation.isPending || updateMutation.isPending;

  return <div className="operation-page"><header className="operation-heading"><div><p className="section-label">Contenido operativo</p><h1>Promociones</h1><p>Administra las promociones que puede mostrar la Home pública.</p></div></header><div className="promotion-admin-layout"><section className="promotion-admin-list"><div className="operation-section-heading"><h2>Promociones activas y pausadas</h2><span>{promotions.length} en total</span></div>{promotions.length ? promotions.map((promotion) => <article className="promotion-admin-card" key={promotion.id}><div className="promotion-admin-placeholder" aria-hidden="true">{promotion.imageUrl ? <img alt="" loading="lazy" src={promotion.imageUrl}/> : <span>CP</span>}</div><div><span className={promotion.active ? "active-label" : "inactive-label"}>{promotion.active ? "Activa" : "Inactiva"}</span><h3>{promotion.title}</h3><p>{promotion.description}</p></div><div className="promotion-admin-actions"><button aria-label={"Editar " + promotion.title} onClick={() => setEditing(promotion)} type="button"><Edit3/></button><button aria-label={promotion.active ? "Desactivar " + promotion.title : "Activar " + promotion.title} onClick={() => toggle(promotion)} type="button"><Power/></button></div></article>) : <EmptyState message="No hay promociones creadas."/>}</section><form className="operation-form" onSubmit={submit}><h2>{editing ? "Editar promoción" : "Crear promoción"}</h2><label htmlFor="promotion-title">Título</label><input id="promotion-title" onChange={(event) => setTitle(event.target.value)} value={title}/><label htmlFor="promotion-description">Descripción</label><textarea id="promotion-description" maxLength={180} onChange={(event) => setDescription(event.target.value)} rows={4} value={description}/><label htmlFor="promotion-image">Imagen desde tu equipo (opcional)</label><input accept="image/*" className="sr-only" id="promotion-image" onChange={chooseImage} ref={fileRef} type="file"/><div className="promotion-image-picker">{imageUrl ? <img alt="Vista previa de la promoción" loading="lazy" src={imageUrl}/> : <span>Sin imagen seleccionada</span>}<div><button className="secondary-button" onClick={() => fileRef.current?.click()} type="button"><ImagePlus aria-hidden="true" size={17}/> {imageUrl ? "Cambiar imagen" : "Cargar imagen"}</button>{imageUrl && <button aria-label="Quitar imagen" className="icon-button" onClick={() => { setImageUrl(""); setImageName(""); }} type="button"><X size={18}/></button>}</div>{imageName && <small>{imageName}</small>}</div>{error && <p className="operation-error" role="alert">{error}</p>}<label className="checkbox-field"><input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox"/> Mostrar como activa</label><button className="summary-button" disabled={pending} type="submit">{pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear promoción"}</button>{editing && <button className="secondary-button" onClick={reset} type="button">Cancelar edición</button>}</form></div></div>;
}
