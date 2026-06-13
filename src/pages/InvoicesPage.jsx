import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchStats, fetchInvoices, bulkUpdate, updateInvoice, uploadRetiro } from '../api';
import { useSelection, useToast } from '../store';

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const STATUSES = [
  { value: '',          label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagada',    label: 'Pagada' },
  { value: 'vencida',   label: 'Vencida' },
  { value: 'revision',  label: 'En revisión' },
  { value: 'anulada',   label: 'Anulada' },
];

function fmt(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n ?? 0);
}

// ── Modal de subida de documento de retiro ───────────────────────────
function UploadModal({ invoice, onClose }) {
  const qc       = useQueryClient();
  const { show } = useToast();
  const fileRef  = useRef(null);
  const [over, setOver] = useState(false);

  const uploadMut = useMutation({
    mutationFn: (file) => uploadRetiro(invoice.id, file),
    onSuccess: () => {
      show('Documento subido correctamente', 'success');
      qc.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: () => show('Error al subir el documento', 'error'),
  });

  const handleFiles = (files) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { show('El archivo supera 10 MB', 'error'); return; }
    uploadMut.mutate(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>Subir documento de retiro</span>
          <small style={{ color: 'var(--text-muted)' }}>{invoice.numero}</small>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div
          className={`drop-zone ${over ? 'over' : ''} ${uploadMut.isPending ? 'uploading' : ''}`}
          onDragOver={e => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploadMut.isPending && fileRef.current.click()}
        >
          <div style={{ fontSize: 28 }}>📁</div>
          <p>{uploadMut.isPending ? 'Subiendo…' : 'Arrastra el archivo aquí o haz clic para seleccionar'}</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG, WebP, PDF — máx 10 MB</p>
          <input
            ref={fileRef} type="file" hidden
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Fila con checkbox entregado + botón upload ───────────────────────
function InvoiceRow({ inv, selected, onToggle, onNavigate }) {
  const qc       = useQueryClient();
  const { show } = useToast();
  const [uploadTarget, setUploadTarget] = useState(null);

  const entregadoMut = useMutation({
    mutationFn: (val) => updateInvoice(inv.id, { entregado: val }),
    onSuccess: (_, val) => {
      show(val ? 'Marcado como entregado' : 'Marcado como no entregado', 'success');
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', String(inv.id)] });
    },
    onError: () => show('Error al actualizar entregado', 'error'),
  });

  return (
    <>
      <tr onClick={onNavigate}>
        <td onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={onToggle} />
        </td>
        <td style={{ fontWeight: 600 }}>{inv.numero}</td>
        <td>{inv.cliente}</td>
        <td style={{ color: 'var(--text-muted)' }}>{inv.empresa ?? '—'}</td>
        <td>{inv.mes}</td>
        <td className="text-right">{fmt(inv.monto)}</td>
        <td><span className={`badge ${inv.nitStatus}`}>{inv.nitStatus}</span></td>
        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={inv.entregado ?? false}
              disabled={entregadoMut.isPending}
              onChange={e => entregadoMut.mutate(e.target.checked)}
              title={inv.entregado ? 'Marcar como no entregado' : 'Marcar como entregado'}
              style={{ cursor: 'pointer', width: 15, height: 15 }}
            />
            <button
              className="upload-retiro-btn"
              onClick={() => setUploadTarget(inv)}
              title="Subir documento de retiro"
            >
              📎
            </button>
          </div>
        </td>
      </tr>
      {uploadTarget && (
        <UploadModal invoice={uploadTarget} onClose={() => setUploadTarget(null)} />
      )}
    </>
  );
}

export default function InvoicesPage() {
  const navigate     = useNavigate();
  const qc           = useQueryClient();
  const { show }     = useToast();
  const { selectedIds, toggle, selectAll, clear } = useSelection();

  const [filters, setFilters] = useState({ status: '', mes: '', search: '' });
  const [page, setPage]       = useState(0);
  const [bulkStatus, setBulkStatus] = useState('pagada');

  // ── Queries ──────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn:  fetchStats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filters, page],
    queryFn:  () => fetchInvoices({ ...filters, page, size: 20 }),
    keepPreviousData: true,
  });

  const invoices    = data?.content ?? [];
  const totalPages  = data?.totalPages ?? 1;
  const totalItems  = data?.totalElements ?? 0;

  // ── Bulk mutation ────────────────────────────────────────────────
  const bulkMut = useMutation({
    mutationFn: () => bulkUpdate([...selectedIds], bulkStatus),
    onSuccess: (res) => {
      show(`${res.updated} facturas actualizadas a "${bulkStatus}"`, 'success');
      clear();
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: () => show('Error al actualizar facturas', 'error'),
  });

  // ── Helpers ──────────────────────────────────────────────────────
  const setFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(0);
    clear();
  };

  const allIds = invoices.map(i => i.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  return (
    <>
      <div className="topbar">
        <h1>Facturas</h1>
        <span className="text-muted">{totalItems} registros</span>
      </div>

      <div className="page-body">

        {/* Stats */}
        <div className="stats-grid">
          {[
            { key: 'total',     label: 'Total',      val: stats?.total },
            { key: 'pendiente', label: 'Pendientes',  val: stats?.pendiente },
            { key: 'pagada',    label: 'Pagadas',     val: stats?.pagada },
            { key: 'vencida',   label: 'Vencidas',    val: stats?.vencida },
            { key: 'revision',  label: 'En revisión', val: stats?.revision },
          ].map(({ key, label, val }) => (
            <div key={key} className={`stat-card ${key}`}>
              <div className="label">{label}</div>
              <div className="value">{val ?? '—'}</div>
            </div>
          ))}
          <div className="stat-card" style={{ gridColumn: 'span 1' }}>
            <div className="label">Monto pendiente</div>
            <div className="value" style={{ fontSize: 18 }}>{fmt(stats?.montoPendiente)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-bar">
          <input
            placeholder="Buscar cliente, empresa, N° factura…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filters.mes} onChange={e => setFilter('mes', e.target.value)}>
            <option value="">Todos los meses</option>
            {MESES.slice(1).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Barra de acciones bulk */}
        {selectedIds.size > 0 && (
          <div className="filters-bar" style={{ background: '#eff6ff', borderColor: '#93c5fd' }}>
            <span style={{ fontWeight: 600, color: '#1e40af' }}>
              {selectedIds.size} seleccionadas
            </span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
              {STATUSES.slice(1).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button className="btn btn-primary btn-sm"
              onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}>
              {bulkMut.isPending ? 'Guardando…' : 'Aplicar a selección'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={clear}>Cancelar</button>
          </div>
        )}

        {/* Tabla */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox"
                    checked={allSelected}
                    onChange={() => allSelected ? clear() : selectAll(allIds)}
                  />
                </th>
                <th>N° Factura</th>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Mes</th>
                <th className="text-right">Monto</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Entregado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
                : invoices.map(inv => (
                  <InvoiceRow
                    key={inv.id}
                    inv={inv}
                    selected={selectedIds.has(inv.id)}
                    onToggle={() => toggle(inv.id)}
                    onNavigate={() => navigate(`/facturas/${inv.id}`)}
                  />
                ))
              }
            </tbody>
          </table>

          {/* Paginación */}
          <div className="pagination">
            <button className="btn btn-outline btn-sm"
              onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              ← Anterior
            </button>
            <span>Página {page + 1} de {totalPages}</span>
            <button className="btn btn-outline btn-sm"
              onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
