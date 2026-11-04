'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AcademicDatabaseState,
  AcademicTask,
  CorteConfig,
  CorteNumber,
  ScheduleBlock,
  StudentConfig,
  Subject,
  TaskAttachment,
  TaskStatus,
} from '@/types/academic';
import {
  createDefaultCortesConfig,
  INITIAL_ACADEMIC_STATE,
} from '@/lib/unefa-pensum-seed';
import {
  defaultStorageMode,
  fetchAllFromSupabase,
  getSupabaseClient,
  isSupabaseConfigured,
  syncStateToSupabase,
} from '@/lib/supabase';

const STORAGE_KEY = 'unefa_studyos_state_v2';

interface AcademicContextValue {
  state: AcademicDatabaseState;
  isHydrated: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  storageMode: 'memory' | 'supabase';
  isSupabaseReady: boolean;
  syncStatusMessage: string | null;
  // Config
  updateConfig: (partial: Partial<StudentConfig>) => void;
  // Subjects (Materias)
  addSubject: (
    subject: Omit<Subject, 'id' | 'createdAt' | 'cortesConfig'> & {
      cortesConfig?: CorteConfig[];
    }
  ) => Subject;
  updateSubject: (id: string, partial: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  updateCorteConfig: (
    subjectId: string,
    corte: CorteNumber,
    partial: Partial<CorteConfig>
  ) => void;
  // Schedule (Horarios)
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => ScheduleBlock;
  updateScheduleBlock: (id: string, partial: Partial<ScheduleBlock>) => void;
  deleteScheduleBlock: (id: string) => void;
  // Tasks (Tareas / Trabajos / Evaluaciones)
  addTask: (
    task: Omit<AcademicTask, 'id' | 'createdAt' | 'updatedAt'>
  ) => AcademicTask;
  updateTask: (id: string, partial: Partial<AcademicTask>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  logTaskTime: (id: string, deltaMinutes: number) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  addAttachment: (
    taskId: string,
    attachment: Omit<TaskAttachment, 'id' | 'addedAt'>
  ) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  // Database & Memory Actions
  syncMemoryToSupabase: () => Promise<{ ok: boolean; message: string }>;
  resetToDemoSeed: () => void;
  clearAllData: () => void;
  importStateJSON: (jsonStr: string) => { ok: boolean; message: string };
}

const AcademicContext = createContext<AcademicContextValue | null>(null);

export function AcademicProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AcademicDatabaseState>(
    INITIAL_ACADEMIC_STATE
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [storageMode] = useState<'memory' | 'supabase'>(defaultStorageMode);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(
    null
  );
  const skipNextAutoSyncRef = useRef(true);

  // Hidratar desde PostgreSQL / Supabase (con respaldo en LocalStorage)
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const savedTheme = window.localStorage.getItem('unefa_studyos_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          if (mounted) setTheme(savedTheme);
          document.documentElement.classList.toggle('dark', savedTheme === 'dark');
          document.documentElement.classList.toggle('light', savedTheme === 'light');
        } else {
          document.documentElement.classList.add('dark');
        }

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AcademicDatabaseState;
          if (parsed && Array.isArray(parsed.subjects) && Array.isArray(parsed.tasks)) {
            if (mounted) {
              skipNextAutoSyncRef.current = true;
              setState(parsed);
            }
          }
        }
        if (defaultStorageMode === 'supabase' && isSupabaseConfigured) {
          const remote = await fetchAllFromSupabase();
          if (remote && mounted) {
            const hasOldFakeDemo = remote.subjects.some(
              (s) => s.id === 'subj-isw1' || s.professor === 'Ing. Carlos Méndez'
            );
            if (hasOldFakeDemo) {
              const supabase = getSupabaseClient();
              if (supabase) {
                await supabase
                  .from('subjects')
                  .delete()
                  .in('id', [
                    'subj-isw1',
                    'subj-bd1',
                    'subj-io',
                    'subj-so',
                    'subj-arq',
                    'subj-din',
                  ]);
              }
              skipNextAutoSyncRef.current = true;
              setState(INITIAL_ACADEMIC_STATE);
              await syncStateToSupabase(INITIAL_ACADEMIC_STATE);
            } else if (remote.subjects.length > 0) {
              skipNextAutoSyncRef.current = true;
              setState(remote);
            } else {
              // Primera vez que se conecta con las tablas vacías en Supabase: subir datos actuales automáticamente
              const initialToSync = raw
                ? (JSON.parse(raw) as AcademicDatabaseState)
                : INITIAL_ACADEMIC_STATE;
              await syncStateToSupabase(initialToSync);
            }
          }
        }
      } catch (e) {
        console.warn('Error cargando estado inicial:', e);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Guardar automáticamente en LocalStorage + Base de Datos PostgreSQL/Supabase en cada cambio
  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('No se pudo persistir en localStorage:', e);
    }

    if (skipNextAutoSyncRef.current) {
      skipNextAutoSyncRef.current = false;
      return;
    }

    if (defaultStorageMode === 'supabase') {
      const timer = setTimeout(() => {
        syncStateToSupabase(state).catch((err) =>
          console.warn('Error en auto-sync con base de datos:', err)
        );
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [state, isHydrated]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem('unefa_studyos_theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        document.documentElement.classList.toggle('light', next === 'light');
      } catch {}
      return next;
    });
  }, []);

  const updateConfig = useCallback((partial: Partial<StudentConfig>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...partial },
    }));
  }, []);

  const addSubject = useCallback(
    (
      subjectInput: Omit<Subject, 'id' | 'createdAt' | 'cortesConfig'> & {
        cortesConfig?: CorteConfig[];
      }
    ): Subject => {
      const newSubject: Subject = {
        ...subjectInput,
        id: `subj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        cortesConfig: subjectInput.cortesConfig ?? createDefaultCortesConfig(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSubject],
      }));
      return newSubject;
    },
    []
  );

  const updateSubject = useCallback((id: string, partial: Partial<Subject>) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.id === id ? { ...s, ...partial } : s
      ),
    }));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      schedule: prev.schedule.filter((b) => b.subjectId !== id),
      tasks: prev.tasks.filter((t) => t.subjectId !== id),
    }));
    const supabase = getSupabaseClient();
    if (supabase && defaultStorageMode === 'supabase') {
      supabase.from('subjects').delete().eq('id', id).then();
    }
  }, []);

  const updateCorteConfig = useCallback(
    (
      subjectId: string,
      corte: CorteNumber,
      partial: Partial<CorteConfig>
    ) => {
      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => {
          if (s.id !== subjectId) return s;
          const exists = s.cortesConfig.some((c) => c.corte === corte);
          const nextCortes = exists
            ? s.cortesConfig.map((c) =>
                c.corte === corte ? { ...c, ...partial } : c
              )
            : [
                ...s.cortesConfig,
                {
                  corte,
                  useManualGrade: false,
                  manualGrade20: null,
                  teacherCorteFeedback: '',
                  studentCorteNotes: '',
                  isClosed: false,
                  ...partial,
                },
              ];
          return { ...s, cortesConfig: nextCortes };
        }),
      }));
    },
    []
  );

  const addScheduleBlock = useCallback(
    (blockInput: Omit<ScheduleBlock, 'id'>): ScheduleBlock => {
      const newBlock: ScheduleBlock = {
        ...blockInput,
        id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setState((prev) => ({
        ...prev,
        schedule: [...prev.schedule, newBlock],
      }));
      return newBlock;
    },
    []
  );

  const updateScheduleBlock = useCallback(
    (id: string, partial: Partial<ScheduleBlock>) => {
      setState((prev) => ({
        ...prev,
        schedule: prev.schedule.map((b) =>
          b.id === id ? { ...b, ...partial } : b
        ),
      }));
    },
    []
  );

  const deleteScheduleBlock = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((b) => b.id !== id),
    }));
    const supabase = getSupabaseClient();
    if (supabase && defaultStorageMode === 'supabase') {
      supabase.from('schedule_blocks').delete().eq('id', id).then();
    }
  }, []);

  const addTask = useCallback(
    (
      taskInput: Omit<AcademicTask, 'id' | 'createdAt' | 'updatedAt'>
    ): AcademicTask => {
      const now = new Date().toISOString();
      const newTask: AcademicTask = {
        ...taskInput,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
      return newTask;
    },
    []
  );

  const updateTask = useCallback(
    (id: string, partial: Partial<AcademicTask>) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id
            ? { ...t, ...partial, updatedAt: new Date().toISOString() }
            : t
        ),
      }));
    },
    []
  );

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
    const supabase = getSupabaseClient();
    if (supabase && defaultStorageMode === 'supabase') {
      supabase.from('academic_tasks').delete().eq('id', id).then();
    }
  }, []);

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? { ...t, status, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  }, []);

  const logTaskTime = useCallback((id: string, deltaMinutes: number) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const nextLogged = Math.max(0, (t.loggedMinutes || 0) + deltaMinutes);
        const nextStatus =
          t.status === 'pendiente' && nextLogged > 0 ? 'en_progreso' : t.status;
        return {
          ...t,
          loggedMinutes: nextLogged,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    if (!title.trim()) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [
            ...t.subtasks,
            {
              id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              title: title.trim(),
              completed: false,
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const removeSubtask = useCallback((taskId: string, subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const addAttachment = useCallback(
    (
      taskId: string,
      attachment: Omit<TaskAttachment, 'id' | 'addedAt'>
    ) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            attachments: [
              ...t.attachments,
              {
                ...attachment,
                id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                addedAt: new Date().toISOString(),
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    []
  );

  const removeAttachment = useCallback(
    (taskId: string, attachmentId: string) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            attachments: t.attachments.filter((a) => a.id !== attachmentId),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    []
  );

  const syncMemoryToSupabase = useCallback(async () => {
    setSyncStatusMessage('Sincronizando con Supabase...');
    const res = await syncStateToSupabase(state);
    setSyncStatusMessage(res.message);
    setTimeout(() => setSyncStatusMessage(null), 5000);
    return res;
  }, [state]);

  const resetToDemoSeed = useCallback(() => {
    setState(INITIAL_ACADEMIC_STATE);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(INITIAL_ACADEMIC_STATE)
    );
    const supabase = getSupabaseClient();
    if (supabase && defaultStorageMode === 'supabase') {
      supabase
        .from('subjects')
        .delete()
        .neq('id', '__none__')
        .then(() => syncStateToSupabase(INITIAL_ACADEMIC_STATE));
    }
  }, []);

  const clearAllData = useCallback(() => {
    const emptyState: AcademicDatabaseState = {
      config: state.config,
      subjects: [],
      schedule: [],
      tasks: [],
    };
    setState(emptyState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
    const supabase = getSupabaseClient();
    if (supabase && defaultStorageMode === 'supabase') {
      supabase.from('subjects').delete().neq('id', '__none__').then();
    }
  }, [state.config]);

  const importStateJSON = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr) as AcademicDatabaseState;
      if (!parsed || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.tasks)) {
        return {
          ok: false,
          message: 'El archivo JSON no tiene el formato válido de UNEFA StudyOS.',
        };
      }
      setState(parsed);
      return { ok: true, message: 'Datos importados correctamente en memoria.' };
    } catch {
      return { ok: false, message: 'Error al leer el archivo JSON.' };
    }
  }, []);

  const value = useMemo<AcademicContextValue>(
    () => ({
      state,
      isHydrated,
      theme,
      toggleTheme,
      storageMode,
      isSupabaseReady: isSupabaseConfigured,
      syncStatusMessage,
      updateConfig,
      addSubject,
      updateSubject,
      deleteSubject,
      updateCorteConfig,
      addScheduleBlock,
      updateScheduleBlock,
      deleteScheduleBlock,
      addTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      logTaskTime,
      toggleSubtask,
      addSubtask,
      removeSubtask,
      addAttachment,
      removeAttachment,
      syncMemoryToSupabase,
      resetToDemoSeed,
      clearAllData,
      importStateJSON,
    }),
    [
      state,
      isHydrated,
      theme,
      toggleTheme,
      storageMode,
      syncStatusMessage,
      updateConfig,
      addSubject,
      updateSubject,
      deleteSubject,
      updateCorteConfig,
      addScheduleBlock,
      updateScheduleBlock,
      deleteScheduleBlock,
      addTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      logTaskTime,
      toggleSubtask,
      addSubtask,
      removeSubtask,
      addAttachment,
      removeAttachment,
      syncMemoryToSupabase,
      resetToDemoSeed,
      clearAllData,
      importStateJSON,
    ]
  );

  return (
    <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>
  );
}

export function useAcademic() {
  const ctx = useContext(AcademicContext);
  if (!ctx) {
    throw new Error('useAcademic debe usarse dentro de un AcademicProvider');
  }
  return ctx;
}
