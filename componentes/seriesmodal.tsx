'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Trash2, Link as LinkIcon, Upload, CalendarDays, Tv } from 'lucide-react';

interface SeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BackupLinkInput {
  platform_name: string;
  link_type: 'url' | 'telegram' | 'cloud_storage';
  url: string;
  notes: string;
}

const DAYS_OF_WEEK = [
  'Por definir',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

export default function SeriesModal({ isOpen, onClose, onSuccess }: SeriesModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('Tailandia');
  const [type, setType] = useState('Serie');
  const [status, setStatus] = useState('Viendo');
  const [rating, setRating] = useState(5);
  const [broadcastDay, setBroadcastDay] = useState('Por definir');
  const [releaseDate, setReleaseDate] = useState('');
  
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [totalEpisodes, setTotalEpisodes] = useState(12);

  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  const [posterUrl, setPosterUrl] = useState('');
  
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState<BackupLinkInput[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen del póster no debe pasar de 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addLinkField = () => {
    setLinks([...links, { platform_name: 'Telegram', link_type: 'telegram', url: '', notes: '' }]);
  };

  const removeLinkField = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLinkField = (index: number, field: keyof BackupLinkInput, value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'platform_name') {
      const valLower = value.toLowerCase();
      if (valLower.includes('telegram')) updated[index].link_type = 'telegram';
      else if (valLower.includes('mega') || valLower.includes('drive') || valLower.includes('nube')) updated[index].link_type = 'cloud_storage';
      else updated[index].link_type = 'url';
    }

    setLinks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let preparedNotes = notes;
      if (broadcastDay && broadcastDay !== 'Por definir') {
        preparedNotes = `📅 Día de emisión: ${broadcastDay}\n${preparedNotes}`;
      }

      const { data: newSeries, error: seriesError } = await supabase
        .from('series')
        .insert([
          {
            user_id: user?.id,
            title,
            country,
            type,
            status,
            rating: Number(rating),
            current_episode: Number(currentEpisode),
            total_episodes: Number(totalEpisodes),
            release_date: releaseDate || null,
            poster_url: posterUrl,
            notes: preparedNotes,
          },
        ])
        .select()
        .single();

      if (seriesError) throw seriesError;

      if (links.length > 0 && newSeries) {
        const linksToInsert = links
          .filter((l) => l.url.trim() !== '')
          .map((l) => ({
            series_id: newSeries.id,
            platform_name: l.platform_name,
            link_type: l.link_type,
            url: l.url,
            notes: l.notes,
          }));

        if (linksToInsert.length > 0) {
          const { error: linksError } = await supabase.from('backup_links').insert(linksToInsert);
          if (linksError) throw linksError;
        }
      }

      setTitle('');
      setPosterUrl('');
      setNotes('');
      setReleaseDate('');
      setCurrentEpisode(1);
      setTotalEpisodes(12);
      setBroadcastDay('Por definir');
      setLinks([]);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      alert('Error al guardar la serie: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl p-6 text-slate-800 max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-xl font-extrabold text-[#1e1e38]">Agregar Nueva Serie BL</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Título de la Serie *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. My Stand-In"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">País</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
              >
                <option value="Tailandia">🇹🇭 Tailandia</option>
                <option value="Corea del Sur">🇰🇷 Corea del Sur</option>
                <option value="Japón">🇯🇵 Japón</option>
                <option value="China">🇨🇳 China / C-Drama</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
              >
                <option value="Serie">Serie</option>
                <option value="Película">Película</option>
                <option value="Especial">Especial / OVA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
              >
                <option value="Viendo">Viendo</option>
                <option value="Terminada">Terminada</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Re-viendo">Re-viendo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-[#5b63be]" /> Transmisión
              </label>
              <select
                value={broadcastDay}
                onChange={(e) => setBroadcastDay(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha de estreno + Capítulos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">📅 Fecha Estreno</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
              />
            </div>

            {type !== 'Película' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cap. Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={currentEpisode}
                    onChange={(e) => setCurrentEpisode(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Total Capítulos</label>
                  <input
                    type="number"
                    min="1"
                    value={totalEpisodes}
                    onChange={(e) => setTotalEpisodes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Calificación ⭐</label>
              <input
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Póster Principal</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setImageInputType('url')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    imageInputType === 'url' ? 'bg-[#5b63be] text-white border-[#5b63be]' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" /> Enlace URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('file')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    imageInputType === 'file' ? 'bg-[#5b63be] text-white border-[#5b63be]' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Subir de Galería
                </button>
              </div>

              {imageInputType === 'url' ? (
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
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

              {posterUrl && (
                <div className="mt-2 relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                  <img src={posterUrl} alt="Vista previa póster" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Notas Personales</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Ver versión Uncut."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d9539f]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 sm:w-auto bg-[#d9539f] hover:bg-[#c4448c] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Serie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}