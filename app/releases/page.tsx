'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Plus, Bell, CheckCircle2, X, MoreVertical, Pencil, Trash2, Send, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface UpcomingRelease {
  id: string;
  title: string;
  country: string;
  release_date: string;
  platform: string;
  poster_url?: string;
  reminder_notes: string;
  is_released: boolean;
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<UpcomingRelease[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Selector de Método de Imagen ('url' | 'file')
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');

  // Estados del Formulario de Creación
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('Tailandia');
  const [releaseDate, setReleaseDate] = useState('');
  const [platform, setPlatform] = useState('GMMTV YouTube');
  const [posterUrl, setPosterUrl] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');

  // Estado para la Edición
  const [editingRelease, setEditingRelease] = useState<UpcomingRelease | null>(null);

  const fetchReleases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('upcoming_releases')
      .select('*')
      .order('release_date', { ascending: true });

    if (!error && data) {
      setReleases(data as UpcomingRelease[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // Convertir archivo local a Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe pesar más de 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit && editingRelease) {
        setEditingRelease({ ...editingRelease, poster_url: base64String });
      } else {
        setPosterUrl(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Crear Nuevo Estreno
  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('upcoming_releases').insert([
      {
        title,
        country,
        release_date: releaseDate || null,
        platform,
        poster_url: posterUrl,
        reminder_notes: reminderNotes,
        is_released: false,
      },
    ]);

    if (!error) {
      setTitle('');
      setReleaseDate('');
      setPosterUrl('');
      setReminderNotes('');
      setIsModalOpen(false);
      fetchReleases();
    } else {
      alert('Error al guardar el estreno: ' + error.message);
    }
  };

  // Editar Estreno
  const handleUpdateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRelease) return;

    const { error } = await supabase
      .from('upcoming_releases')
      .update({
        title: editingRelease.title,
        country: editingRelease.country,
        release_date: editingRelease.release_date || null,
        platform: editingRelease.platform,
        poster_url: editingRelease.poster_url || '',
        reminder_notes: editingRelease.reminder_notes || '',
      })
      .eq('id', editingRelease.id);

    if (!error) {
      setIsEditModalOpen(false);
      setEditingRelease(null);
      fetchReleases();
    } else {
      alert('Error al actualizar el estreno: ' + error.message);
    }
  };

  // Eliminar Estreno
  const handleDeleteRelease = async (id: string) => {
    if (confirm('¿Estás segura de que deseas eliminar este recordatorio de estreno?')) {
      const { error } = await supabase.from('upcoming_releases').delete().eq('id', id);
      if (!error) {
        setReleases(releases.filter((r) => r.id !== id));
      } else {
        alert('Error al eliminar el estreno');
      }
    }
    setOpenMenuId(null);
  };

  // Cambiar estado (Pendiente / Ya Estrenó)
  const toggleReleasedStatus = async (item: UpcomingRelease) => {
    const newStatus = !item.is_released;

    const { error: updateError } = await supabase
      .from('upcoming_releases')
      .update({ is_released: newStatus })
      .eq('id', item.id);

    if (updateError) {
      alert('Error al actualizar el estado: ' + updateError.message);
      return;
    }

    if (newStatus) {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: existing } = await supabase
        .from('series')
        .select('id')
        .eq('title', item.title)
        .maybeSingle();

      if (!existing) {
        await supabase.from('series').insert([
          {
            user_id: user?.id,
            title: item.title,
            country: item.country,
            status: 'Pendiente',
            poster_url: item.poster_url || '',
            notes: item.reminder_notes ? `Estrenado el ${item.release_date?.split('T')[0]}. ${item.reminder_notes}` : 'Serie recién estrenada.',
            rating: 4,
          },
        ]);
      }
    }

    fetchReleases();
  };

  return (
    <div className="space-y-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1e1e38] flex items-center gap-2">
            Próximos <span className="text-[#5b63be]">Estrenos</span> <CalendarIcon className="w-7 h-7 text-[#5b63be]" />
          </h1>
          <p className="text-[#64748b] text-sm mt-1 font-medium">
            Recordatorios y fechas de lanzamiento de tus series BL esperadas.
          </p>
        </div>

        <button
          onClick={() => {
            setPosterUrl('');
            setImageInputType('url');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-[#d9539f] hover:bg-[#c4448c] text-white px-6 py-3 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" /> Agregar Estreno
        </button>
      </div>

      {/* Lista de Estrenos */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-slate-500 text-sm font-medium">Cargando estrenos...</p>
        </div>
      ) : releases.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 shadow-sm border border-slate-100">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold">No tienes próximos estrenos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releases.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative ${
                item.is_released ? 'opacity-60 grayscale-[30%]' : ''
              }`}
            >
              <div>
                <div className="relative h-56 bg-slate-100 rounded-2xl overflow-hidden mb-4 border border-slate-100">
                  {item.poster_url ? (
                    <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                      Sin Vista Previa
                    </div>
                  )}

                  <span className="absolute top-3 left-3 bg-[#1b203e]/80 backdrop-blur-md text-[10px] px-3 py-1 rounded-full text-white font-bold">
                    {item.country}
                  </span>

                  <span className="absolute top-3 right-3 bg-[#d9539f] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <Send className="w-3 h-3 text-white" /> {item.platform}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-extrabold text-[#1e1e38] text-lg leading-snug">{item.title}</h3>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-6 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20">
                        <button
                          onClick={() => {
                            setEditingRelease(item);
                            setImageInputType(item.poster_url?.startsWith('data:') ? 'file' : 'url');
                            setIsEditModalOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-500" /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteRelease(item.id)}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {item.release_date ? (
                  <div className="bg-[#f3f4fa] p-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-[#5b63be] mb-3">
                    <CalendarIcon className="w-4 h-4 text-[#5b63be]" />
                    <span>
                      Estreno: {
                        (() => {
                          const [year, month, day] = item.release_date.split('T')[0].split('-');
                          const date = new Date(Number(year), Number(month) - 1, Number(day));
                          return date.toLocaleDateString('es-ES', { dateStyle: 'medium' });
                        })()
                      }
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#f3f4fa] p-2.5 rounded-2xl text-xs font-medium text-slate-500 mb-3">
                    📌 Fecha por anunciar
                  </div>
                )}

                {item.reminder_notes && (
                  <p className="text-xs text-slate-600 bg-amber-50/60 border border-amber-100 p-2.5 rounded-2xl mb-2">
                    📌 {item.reminder_notes}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  {item.is_released ? 'Ya estrenado' : 'Pendiente'}
                </span>

                <button
                  onClick={() => toggleReleasedStatus(item)}
                  className={`text-xs px-4 py-2 rounded-2xl font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs ${
                    item.is_released
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-[#8288d9] hover:bg-[#6c72cc] text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {item.is_released ? 'Pendiente' : 'Se estreno recientemente'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Modal para Agregar Estreno */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-[#1e1e38]">Agregar Próximo Estreno</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título de la Serie *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Fool In Love"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">País</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  >
                    <option value="Tailandia">Tailandia</option>
                    <option value="Corea del Sur">Corea del Sur</option>
                    <option value="Taiwán">Taiwán</option>
                    <option value="Japón">Japón</option>
                    <option value="China">China</option>
                    <option value="Filipinas">Filipinas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Plataforma / Canal</label>
                  <input
                    type="text"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="Telegram, Youtube..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  />
                </div>
              </div>

              {/* Selector de Método de Imagen (URL o Archivo) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Imagen / Póster</label>
                
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageInputType('url')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      imageInputType === 'url'
                        ? 'bg-[#5b63be] text-white border-[#5b63be]'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Enlace URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputType('file')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      imageInputType === 'file'
                        ? 'bg-[#5b63be] text-white border-[#5b63be]'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Subir de Galería/Archivo
                  </button>
                </div>

                {imageInputType === 'url' ? (
                  <input
                    type="text"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://ejemplo.com/poster.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#d9539f] file:text-white hover:file:bg-[#c4448c]"
                  />
                )}

                {/* Previsualización */}
                {posterUrl && (
                  <div className="mt-2 relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={posterUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                      Vista previa
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Estreno</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notas de Recordatorio</label>
                <textarea
                  rows={2}
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  placeholder="Ej. Estrena el primer episodio con subtítulos"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#d9539f] hover:bg-[#c4448c] text-white py-2.5 rounded-xl font-bold text-xs shadow-md"
                >
                  Guardar Estreno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal para Editar Estreno */}
      {isEditModalOpen && editingRelease && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-[#1e1e38]">Editar Estreno</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRelease} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={editingRelease.title}
                  onChange={(e) => setEditingRelease({ ...editingRelease, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">País</label>
                  <select
                    value={editingRelease.country}
                    onChange={(e) => setEditingRelease({ ...editingRelease, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  >
                    <option value="Tailandia">Tailandia</option>
                    <option value="Corea del Sur">Corea del Sur</option>
                    <option value="Taiwán">Taiwán</option>
                    <option value="Japón">Japón</option>
                    <option value="China">China</option>
                    <option value="Filipinas">Filipinas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Plataforma</label>
                  <input
                    type="text"
                    value={editingRelease.platform}
                    onChange={(e) => setEditingRelease({ ...editingRelease, platform: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  />
                </div>
              </div>

              {/* Selector Imagen Edición */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Imagen / Póster</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageInputType('url')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      imageInputType === 'url'
                        ? 'bg-[#5b63be] text-white border-[#5b63be]'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Enlace URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputType('file')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      imageInputType === 'file'
                        ? 'bg-[#5b63be] text-white border-[#5b63be]'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Subir de Galería/Archivo
                  </button>
                </div>

                {imageInputType === 'url' ? (
                  <input
                    type="text"
                    value={editingRelease.poster_url || ''}
                    onChange={(e) => setEditingRelease({ ...editingRelease, poster_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#d9539f] file:text-white hover:file:bg-[#c4448c]"
                  />
                )}

                {editingRelease.poster_url && (
                  <div className="mt-2 relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={editingRelease.poster_url} alt="Vista previa" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Estreno</label>
                <input
                  type="date"
                  value={editingRelease.release_date ? editingRelease.release_date.split('T')[0] : ''}
                  onChange={(e) => setEditingRelease({ ...editingRelease, release_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notas de Recordatorio</label>
                <textarea
                  rows={2}
                  value={editingRelease.reminder_notes || ''}
                  onChange={(e) => setEditingRelease({ ...editingRelease, reminder_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#d9539f] hover:bg-[#c4448c] text-white py-2.5 rounded-xl font-bold text-xs shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}