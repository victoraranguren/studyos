'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAcademic } from '@/context/AcademicContext';
import {
  CheckCircle2,
  CloudUpload,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseStatusModal({
  isOpen,
  onClose,
}: DatabaseStatusModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    state,
    storageMode,
    isSupabaseReady,
    syncMemoryToSupabase,
    resetToDemoSeed,
    clearAllData,
    importStateJSON,
    updateConfig,
  } = useAcademic();

  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [studentName, setStudentName] = useState(state.config.studentName);
  const [sectionCode, setSectionCode] = useState(state.config.sectionCode);
  const [currentSemester, setCurrentSemester] = useState(
    state.config.currentSemester
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

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unefa-studyos-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusFeedback('Backup JSON descargado exitosamente.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importStateJSON(String(reader.result || ''));
      setStatusFeedback(res.message);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSyncSupabase = async () => {
    const res = await syncMemoryToSupabase();
    setStatusFeedback(res.message);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      studentName: studentName.trim() || 'Estudiante UNEFA',
      sectionCode: sectionCode.trim() || '06S-2614-D1',
      currentSemester: Number(currentSemester) || 6,
    });
    setStatusFeedback('Perfil de estudiante actualizado en memoria.');
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="db-modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="w-full max-w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl p-0 backdrop:bg-slate-950/80 backdrop:backdrop-blur-xs mb-0 mt-auto sm:m-auto"
    >
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="db-modal-title" className="text-lg font-bold text-white">
                Almacenamiento En Memoria y Conexión Supabase
              </h2>
              <p className="text-sm text-muted">
                Modo actual:{' '}
                <strong className="text-emerald-400">
                  {storageMode === 'memory'
                    ? 'En Memoria (Persistencia Local Instantánea)'
                    : 'Conectado a Supabase'}
                </strong>
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

        <div className="p-6 overflow-y-auto space-y-5">
          {statusFeedback && (
            <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-base text-blue-200 flex items-center justify-between">
              <span>{statusFeedback}</span>
              <button
                type="button"
                onClick={() => setStatusFeedback(null)}
                className="text-blue-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Perfil del Estudiante UNEFA */}
          <form
            onSubmit={handleSaveProfile}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
              Datos del Estudiante (Ing. de Sistemas - UNEFA)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-muted mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">
                  Semestre Actual
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">
                  Código de Sección
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sectionCode}
                    onChange={(e) => setSectionCode(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Estado En Memoria y Backups */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-base font-bold text-white">
                  Gestión de Datos en Memoria
                </span>
              </div>
              <span className="text-base text-white">
                {state.subjects.length} materias · {state.schedule.length}{' '}
                horarios · {state.tasks.length} tareas
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Exportar Backup (.JSON)
              </button>

              <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-white flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Importar Backup (.JSON)
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  resetToDemoSeed();
                  setStatusFeedback(
                    'Datos restaurados a la plantilla de demostración UNEFA.'
                  );
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-amber-300 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Demo UNEFA
              </button>

              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setStatusFeedback(
                    'Memoria vaciada. Puedes agregar tus materias desde cero.'
                  );
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-sm font-semibold text-rose-300 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar Todo (Empezar en Blanco)
              </button>
            </div>
          </div>

          {/* Conexión con Supabase (.env) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-950 to-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-emerald-400" />
                Listo para Conectar a Supabase (.env)
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                  isSupabaseReady
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {isSupabaseReady
                  ? 'Variables .env detectadas'
                  : 'Esperando .env.local'}
              </span>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              El esquema SQL completo ya está creado en{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 font-mono">
                supabase/schema.sql
              </code>{' '}
              y la plantilla de variables en{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-900 text-blue-300 font-mono">
                .env.example
              </code>
              . Cuando pases tu <code className="font-mono">.env</code> con{' '}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
              puedes volcar todo lo que hiciste en memoria directo a Supabase con
              un clic:
            </p>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSyncSupabase}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-base font-bold text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Sincronizar Memoria → Supabase
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
