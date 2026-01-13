import { createContext, useContext, ReactNode } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { DerivedTask, Metrics, Task } from '@/types';

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  derivedSorted: DerivedTask[];
  metrics: Metrics;
  lastDeleted: Task | null;
  addTask: (task: Omit<Task, 'id'> & { id?: string }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
  clearLastDeleted: () => void; // method to clear last deleted
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  // Get all task methods & state from useTasks
  const {
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
    // setLastDeleted is NOT exposed
  } = useTasks();

  // Provide a safe way to clear lastDeleted
  const clearLastDeleted = () => {
    undoDelete(); // optional: or just clear without restoring
  };

  // Provide context value including clearLastDeleted
  return (
    <TasksContext.Provider
      value={{
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
        clearLastDeleted,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasksContext must be used within TasksProvider');
  return ctx;
}
