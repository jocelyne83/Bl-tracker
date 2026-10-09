'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SeriesModal from '@/componentes/seriesmodal';
import { Search, Plus, Star, Send, Cloud, ExternalLink, Tv, X, MoreVertical, Pencil, Trash2, Heart, Play, Clock, CheckCircle2, Upload, Link as LinkIcon } from 'lucide-react';

interface BackupLink {
  id: string;
  platform_name: string;
  link_type: string;
  url: string;
  notes: string;
}

interface Series {
  id: string;
  title: string;
  original_title?: string;
  country: string;
  type?: string;
  status: string;
  rating?: number;
  poster_url?: string;
  notes?: string;
  backup_links?: BackupLink[];
}

const COUNTRIES = ['Todos', 'Tailandia', 'Corea del Sur', 'Taiwán', 'Japón', 'China', 'Filipinas'];

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  const [loading, setLoading] = useState(true);
  
  // Modal para agregar (Componente externo existente)
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal e interacción para Editar / Eliminar
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filtros
  const [filterCountry, setFilterCountry] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSeries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('series')
      .select('*, backup_links(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSeries(data as Series[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  // Función para subir y convertir archivo de dispositivo a Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe pasar de 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (editingSeries) {
        setEditingSeries({ ...editingSeries, poster_url: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  // Eliminar Serie
  const handleDeleteSeries = async (id: string) => {
    if (confirm('¿Estás segura de que deseas eliminar esta serie?')) {
      const { error } = await supabase.from('series').delete().eq('id', id);
      if (!error) {
        setSeries(series.filter((s) => s.id !== id));
      } else {
        alert('Error al eliminar la serie en Supabase');
      }
    }
    setOpenMenuId(null);
  };

  // Actualizar Serie
  const handleUpdateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries) return;

    const { error } = await supabase
      .from('series')
      .update({
        title: editingSeries.title,
        original_title: editingSeries.original_title || '',
        country: editingSeries.country,
        status: editingSeries.status,
        rating: editingSeries.rating || 4,
        poster_url: editingSeries.poster_url || '',
        notes: editingSeries.notes || '',
      })
      .eq('id', editingSeries.id);

    if (!error) {
      await fetchSeries();
      setIsEditModalOpen(false);
      setEditingSeries(null);
    } else {
      console.error(error);
      alert('Error al actualizar la serie: ' + error.message);
    }
  };

  // Filtrado combinado
  const filteredSeries = series.filter((item) => {
    const matchesCountry = filterCountry === 'Todos' || item.country === filterCountry;
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      searchLower === '' ||
      item.title.toLowerCase().includes(searchLower) ||
      (item.original_title && item.original_title.toLowerCase().includes(searchLower));

    return matchesCountry && matchesSearch;
  });

  const getLinkIcon = (type: string) => {
    if (type === 'telegram') return <Send className="w-3.5 h-3.5 text-sky-500" />;
    if (type === 'cloud_storage') return <Cloud className="w-3.5 h-3.5 text-amber-500" />;
    return <ExternalLink className="w-3.5 h-3.5 text-pink-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Viendo':
        return <span className="bg-[#8288d9] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs"><Play className="w-3 h-3 fill-white" /> Viendo</span>;
      case 'Pendiente':
        return <span className="bg-[#d9539f] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs"><Clock className="w-3 h-3" /> Pendiente</span>;
      default:
        return <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs"><CheckCircle2 className="w-3 h-3" /> Completado</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1e1e38] flex items-center gap-2">
            Mi Lista <span className="text-[#d9539f]">BL</span> <Heart className="w-6 h-6 text-[#d9539f] fill-[#d9539f]" />
          </h1>
          <p className="text-[#64748b] text-sm mt-1 font-medium">
            Tu catálogo personal de series y películas con respaldos.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#d9539f] hover:bg-[#c4448c] text-white px-6 py-3 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" /> Agregar Serie
        </button>
      </div>

      {/* Controles de búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o nombre original..."
            className="w-full bg-[#3d4580] text-white placeholder-slate-300 pl-11 pr-10 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9539f] transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {COUNTRIES.map((c) => {
            const isSelected = filterCountry === c;
            return (
              <button
                key={c}
                onClick={() => setFilterCountry(c)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#d9539f] text-white shadow-md'
                    : 'bg-[#e2e6f3] text-[#5b63be] hover:bg-[#d5daf0]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Tarjetas */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-slate-500 text-sm font-medium">Cargando tus series...</p>
        </div>
      ) : filteredSeries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 shadow-sm border border-slate-100">
          <Tv className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold">No se encontraron series.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSeries.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative group"
            >
              <div>
                <div className="relative h-60 bg-slate-100 rounded-2xl overflow-hidden mb-4 border border-slate-100">
                  {item.poster_url ? (
                    <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sin Póster</div>
                  )}

                  <span className="absolute top-3 left-3 bg-[#1b203e]/80 backdrop-blur-md text-[10px] px-3 py-1 rounded-full text-white font-bold">
                    {item.country}
                  </span>

                  <div className="absolute top-3 right-3">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                <div className="flex justify-between items-start gap-2 mb-1">
                  <div>
                    <h3 className="font-extrabold text-[#1e1e38] text-base line-clamp-1">{item.title}</h3>
                    {item.original_title && (
                      <p className="text-xs text-slate-400 line-clamp-1">{item.original_title}</p>
                    )}
                  </div>

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
                            setEditingSeries(item);
                            setImageInputType(item.poster_url?.startsWith('data:') ? 'file' : 'url');
                            setIsEditModalOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-500" /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteSeries(item.id)}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= (item.rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-bold text-slate-400 ml-1">
                    {item.rating ? item.rating.toFixed(1) : '0.0'}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-600 line-clamp-2 bg-[#f3f4fa] p-2.5 rounded-xl border border-slate-100 mb-3">
                    💡 {item.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Enlaces de respaldo:</p>
                {item.backup_links && item.backup_links.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.backup_links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#f3f4fa] hover:bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-200 transition-colors"
                      >
                        {getLinkIcon(link.link_type)}
                        <span className="text-[11px] font-medium">{link.platform_name}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Sin links cargados</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Modal para Agregar */}
      <SeriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSeries}
      />

      {/* 2. Modal para Editar */}
      {isEditModalOpen && editingSeries && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#1e1e38]">Editar Serie</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSeries} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={editingSeries.title}
                  onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título Original</label>
                <input
                  type="text"
                  value={editingSeries.original_title || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, original_title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">País</label>
                  <select
                    value={editingSeries.country}
                    onChange={(e) => setEditingSeries({ ...editingSeries, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  >
                    {COUNTRIES.filter((c) => c !== 'Todos').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Estado</label>
                  <select
                    value={editingSeries.status}
                    onChange={(e) => setEditingSeries({ ...editingSeries, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  >
                    <option value="Viendo">Viendo</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Terminado">Terminado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Calificación (1 al 5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={editingSeries.rating || 5}
                  onChange={(e) => setEditingSeries({ ...editingSeries, rating: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                />
              </div>

              {/* Selector de Método de Imagen (URL o Subir Archivo) */}
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
                    value={editingSeries.poster_url || ''}
                    onChange={(e) => setEditingSeries({ ...editingSeries, poster_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#d9539f] file:text-white hover:file:bg-[#c4448c]"
                  />
                )}

                {/* Previsualización */}
                {editingSeries.poster_url && (
                  <div className="mt-2 relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={editingSeries.poster_url} alt="Vista previa" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={editingSeries.notes || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, notes: e.target.value })}
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