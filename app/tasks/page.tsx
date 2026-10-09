'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, CheckCircle2, Circle, Sparkles, Tag, CheckSquare } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  category: string;
  is_completed: boolean;
  created_at: string;
}

const CATEGORIES = ['Personal 🏠', 'Series/BL 🎬', 'Estudios/Trabajo 📚', 'Compras 🛒'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('tasks').insert([
      {
        user_id: user?.id,
        title: newTaskTitle.trim(),
        category: selectedCategory,
        is_completed: false,
      },
    ]);

    if (!error) {
      setNewTaskTitle('');
      fetchTasks();
    } else {
      alert('Error al agregar la tarea');
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) {
      setTasks(tasks.map((t) => (t.id === id ? { ...t, is_completed: !currentStatus } : t)));
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto select-none">
      
      {/* 1. Encabezado Estilizado */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-[#f0f2f8] to-[#e8eaf6] p-6 sm:p-8 border border-white/80 shadow-xs">
        <div className="relative z-10 max-w-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[#a855f7] font-bold text-sm">
            <Sparkles className="w-4 h-4 fill-[#a855f7]" />
            <span>¡Hola, Abigail!</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-[#1e1e38] tracking-tight">
            Organizador de <span className="text-[#8b5cf6] relative inline-block">
              Tareas
              <span className="absolute -top-1 -right-6 text-xs text-[#a855f7]">✦</span>
            </span>
          </h1>

          <p className="text-[#64748b] text-sm font-medium pt-1">
            Gestiona tus pendientes diarios, notas de compras o recordatorios.
          </p>
        </div>

        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#c084fc]/20 via-[#e879f9]/10 to-transparent pointer-events-none rounded-r-3xl" />
      </div>

      {/* 2. Formulario */}
      <div className="bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-slate-200/60 shadow-xs">
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 text-white/80 absolute left-4 pointer-events-none" />
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Escribe una nueva tarea o pendiente..."
              className="w-full bg-[#6366f1]/80 hover:bg-[#6366f1]/90 text-white placeholder-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#a855f7] border border-white/10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#6366f1]/80 hover:bg-[#6366f1]/90 text-white border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#a855f7] cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#1e1e38] text-white">
                {cat}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-gradient-to-r from-[#ec4899] to-[#d946ef] hover:opacity-95 text-white px-7 py-3 rounded-2xl font-black text-sm shadow-md shadow-pink-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" /> Agregar
          </button>
        </form>
      </div>

      {/* 3. Panel Estado Vacío / Lista */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <p className="text-slate-500 text-sm font-medium">Cargando tus tareas...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ff] via-[#faf5ff] to-[#f3e8ff] rounded-3xl p-12 sm:p-20 text-center border border-[#e9d5ff]/60 shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-white/80 rounded-3xl shadow-sm border border-[#d8b4fe]/40 mb-1">
            <CheckSquare className="w-12 h-12 text-[#8b5cf6]" />
          </div>

          <p className="text-[#6b21a8] font-bold text-lg">
            No tienes tareas pendientes.
          </p>
          
          <div className="text-[#a855f7] text-sm font-extrabold flex items-center gap-1">
            <span>♡</span>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent" />
            <span>♡</span>
          </div>

          <div className="absolute bottom-6 right-8 text-right rotate-[-4deg]">
            <p className="text-sm font-black italic text-[#a855f7]">¡Tú puedes! ♡</p>
          </div>

          <div className="absolute top-6 left-8 text-[#c084fc] text-xl">✦</div>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between gap-4 shadow-2xs ${
                task.is_completed
                  ? 'border-slate-100 bg-slate-50/60 opacity-60'
                  : 'border-slate-200/60 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => toggleTaskStatus(task.id, task.is_completed)}
                  className="text-slate-400 hover:text-[#d9539f] transition-colors shrink-0"
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="w-6 h-6 text-[#d9539f] fill-[#d9539f]/10" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-bold truncate ${
                      task.is_completed ? 'line-through text-slate-400' : 'text-[#1e1e38]'
                    }`}
                  >
                    {task.title}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6366f1] bg-[#6366f1]/10 px-2.5 py-0.5 rounded-full mt-1">
                    <Tag className="w-2.5 h-2.5" /> {task.category}
                  </span>
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                title="Eliminar tarea"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}