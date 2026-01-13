import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DerivedTask, Metrics, Task } from "@/types";
import {
  computeAverageROI,
  computePerformanceGrade,
  computeRevenuePerHour,
  computeTimeEfficiency,
  computeTotalRevenue,
  withDerived,
  sortTasks as sortDerived,
} from "@/utils/logic";
import { generateSalesTasks } from "@/utils/seed";

interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  derivedSorted: DerivedTask[];
  metrics: Metrics;
  lastDeleted: Task | null;
  addTask: (task: Omit<Task, "id"> & { id?: string }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
}

const INITIAL_METRICS: Metrics = {
  totalRevenue: 0,
  totalTimeTaken: 0,
  timeEfficiencyPct: 0,
  revenuePerHour: 0,
  averageROI: 0,
  performanceGrade: "Needs Improvement",
};

export function useTasks(): UseTasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);
  const fetchedRef = useRef(false);

  // Normalize task object
  const normalizeTask = useCallback((t: Partial<Task>): Task => {
    const created = t.createdAt ? new Date(t.createdAt) : new Date();
    const completed =
      t.completedAt ||
      (t.status === "Done"
        ? new Date(created.getTime() + 24 * 3600 * 1000).toISOString()
        : undefined);
    return {
      id: t.id ?? crypto.randomUUID(),
      title: t.title ?? "",
      revenue: Number(t.revenue) || 0,
      timeTaken: Number(t.timeTaken) > 0 ? Number(t.timeTaken) : 1,
      priority: t.priority ?? "Medium",
      status: t.status ?? "Todo",
      notes: t.notes ?? "",
      createdAt: created.toISOString(),
      completedAt: completed,
    } as Task;
  }, []);

  // Initial load: JSON fallback to dummy data
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch("/tasks.json");
        if (!res.ok)
          throw new Error(`Failed to load tasks.json (${res.status})`);
        const data = (await res.json()) as any[];
        const normalized = (data.length ? data : generateSalesTasks(50)).map(
          normalizeTask
        );
        if (isMounted) setTasks(normalized);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? "Failed to load tasks");
      } finally {
        if (isMounted) {
          setLoading(false);
          fetchedRef.current = true;
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [normalizeTask]);

  // Derived tasks (with ROI, etc.) sorted
  const derivedSorted = useMemo<DerivedTask[]>(() => {
    const withRoi = tasks.map(withDerived);
    return sortDerived(withRoi);
  }, [tasks]);

  // Metrics computation
  const metrics = useMemo<Metrics>(() => {
    if (tasks.length === 0) return INITIAL_METRICS;
    const totalRevenue = computeTotalRevenue(tasks);
    const totalTimeTaken = tasks.reduce((s, t) => s + t.timeTaken, 0);
    const timeEfficiencyPct = computeTimeEfficiency(tasks);
    const revenuePerHour = computeRevenuePerHour(tasks);
    const averageROI = computeAverageROI(tasks);
    const performanceGrade = computePerformanceGrade(averageROI);
    return {
      totalRevenue,
      totalTimeTaken,
      timeEfficiencyPct,
      revenuePerHour,
      averageROI,
      performanceGrade,
    };
  }, [tasks]);

  // Add task
  const addTask = useCallback(
    (task: Omit<Task, "id"> & { id?: string }) => {
      const t = normalizeTask(task);
      setTasks((prev) => [...prev, t]);
    },
    [normalizeTask]
  );

  // Update task
  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const merged = normalizeTask({ ...t, ...patch });
          // Preserve completedAt if marking as Done now
          if (t.status !== "Done" && merged.status === "Done" && !merged.completedAt) {
            merged.completedAt = new Date().toISOString();
          }
          return merged;
        })
      );
    },
    [normalizeTask]
  );

  // Delete task
  const deleteTask = useCallback(
    (id: string) => {
      const deleted = tasks.find((t) => t.id === id);
      if (!deleted) return;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setLastDeleted(deleted);
    },
    [tasks]
  );

  // Undo delete
  const undoDelete = () => {
  if (!lastDeleted) return;

  setTasks(prev => {
    if (prev.some(t => t.id === lastDeleted.id)) return prev;
    return [lastDeleted!, ...prev];
  });

  setLastDeleted(null);
};

  return {
    tasks,
    loading,
    error,
    derivedSorted,
    metrics,
    lastDeleted,
    addTask,
    updateTask,
    deleteTask,
    undoDelete,
  };
}
