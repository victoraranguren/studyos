'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ModalityType,
  Subject,
  SubjectColor,
} from '@/types/academic';
import { useAcademic } from '@/context/AcademicContext';
import { SUBJECT_COLOR_STYLES } from '@/lib/theme';
import { UNEFA_SISTEMAS_PENSUM } from '@/lib/unefa-pensum-seed';
import {
  BookMarked,
  CheckCircle2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSubject: Subject | null;
}

export function SubjectModal({
  isOpen,
  onClose,
  editingSubject,
}: SubjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state, addSubject, updateSubject, deleteSubject } = useAcademic();

  const defaultColors: SubjectColor[] = [
    'blue',
    'emerald',
    'violet',
    'amber',
    'cyan',
    'rose',
    'indigo',
    'orange',
  ];

  const [code, setCode] = useState(editingSubject?.code ?? 'SYC-');
  const [name, setName] = useState(editingSubject?.name ?? '');
  const [semester, setSemester] = useState(
    editingSubject?.semester ?? (state.config.currentSemester || 6)
  );
  const [credits, setCredits] = useState(editingSubject?.credits ?? 4);
  const [professor, setProfessor] = useState(editingSubject?.professor ?? '');
  const [professorContact, setProfessorContact] = useState(
    editingSubject?.professorContact ?? ''
  );
  const [section, setSection] = useState(
    editingSubject?.section ?? (state.config.sectionCode || '06S-2614-D1')
  );
  const [modality, setModality] = useState<ModalityType>(
    editingSubject?.modality ?? 'Presencial'
  );
  const [color, setColor] = useState<SubjectColor>(
    editingSubject?.color ??
      defaultColors[state.subjects.length % defaultColors.length]
  );
  const [targetGrade, setTargetGrade] = useState(
    editingSubject?.targetGrade ?? (state.config.defaultTargetGrade || 16)
  );
  const [generalNotes, setGeneralNotes] = useState(
    editingSubject?.generalNotes ?? ''
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const handleApplyPensumTemplate = (tplCode: string) => {
    const tpl = UNEFA_SISTEMAS_PENSUM.find((p) => p.code === tplCode);
    if (!tpl) return;
    setCode(tpl.code);
    setName(tpl.name);
    setSemester(tpl.semester);
    setCredits(tpl.credits);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      code: code.trim() || 'SYC-0000',
      name: name.trim(),
      semester: Number(semester) || 6,
      credits: Number(credits) || 4,
      professor: professor.trim() || 'Por asignar',
      professorContact: professorContact.trim(),
      section: section.trim() || '06S-2614-D1',
      modality,
      color,
      targetGrade: Math.min(20, Math.max(10, Number(targetGrade) || 15)),
      generalNotes: generalNotes.trim(),
    };

    if (editingSubject) {
      updateSubject(editingSubject.id, payload);
    } else {
      addSubject(payload);
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="subject-modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="w-full max-w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl p-0 backdrop:bg-slate-950/80 backdrop:backdrop-blur-xs mb-0 mt-auto sm:m-auto"
    >
      <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 id="subject-modal-title" className="text-lg font-bold text-white">
                {editingSubject
                  ? 'Editar Materia UNEFA'
                  : 'Inscribir Materia (Ing. de Sistemas)'}
              </h2>
              <p className="text-sm text-muted">
                Configurada con 4 Cortes de 25% c/u (5.00 pts por corte · Escala 1-20)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-white hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {!editingSubject && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-2">
              <label className="flex items-center gap-1.5 text-base font-semibold text-blue-300">
                <Sparkles className="w-4 h-4" />
                Autocompletar desde el Pensum de Ingeniería de Sistemas UNEFA:
              </label>
              <select
                defaultValue=""
                onChange={(e) => handleApplyPensumTemplate(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
              >
                <option value="">
                  -- Seleccionar materia del pensum o escribir manualmente abajo --
                </option>
                {UNEFA_SISTEMAS_PENSUM.map((tpl) => (
                  <option key={tpl.code} value={tpl.code}>
                    Sem. {tpl.semester} · {tpl.code} - {tpl.name} ({tpl.credits} UC)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                Código UNEFA *
              </label>
              <input
                type="text"
                required
                placeholder="SYC-32225"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-base text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                Nombre de la Asignatura *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Ingeniería del Software I"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1">
                Semestre
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1">
                Unidades Crédito (UC)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1">
                Sección
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1">
                Modalidad
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as ModalityType)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
              >
                <option value="Presencial">Presencial</option>
                <option value="Semipresencial">Semipresencial</option>
                <option value="Virtual">Virtual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                Profesor(a)
              </label>
              <input
                type="text"
                placeholder="Ej: Ing. Carlos Méndez"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-base text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                Contacto / Correo / Grupo del Docente
              </label>
              <input
                type="text"
                placeholder="correo@unefa.edu.ve o Telegram"
                value={professorContact}
                onChange={(e) => setProfessorContact(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-base text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                Meta Personal de Nota (sobre 20 pts)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={20}
                  step={0.5}
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-base">
                  {targetGrade} / 20
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                Color Identificador
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SUBJECT_COLOR_STYLES) as SubjectColor[]).map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      title={SUBJECT_COLOR_STYLES[c].label}
                      className={`w-7 h-7 rounded-full ${
                        SUBJECT_COLOR_STYLES[c].solid
                      } transition-transform ${
                        color === c
                          ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
              Notas Generales y Reglas del Profesor en la Materia
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Usa PostgreSQL, pide normas IEEE en informes, evalúa asistencia a laboratorio..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-base text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95">
          {editingSubject ? (
            <button
              type="button"
              onClick={() => {
                deleteSubject(editingSubject.id);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-sm font-semibold text-rose-300 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Materia
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingSubject ? 'Guardar Materia' : 'Inscribir Materia'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
