import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchStats, fetchInvoices, bulkUpdate } from '../api';
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
                <th>Entregado</th>
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
                  <tr key={inv.id} onClick={() => navigate(`/facturas/${inv.id}`)}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox"
                        checked={selectedIds.has(inv.id)}
                        onChange={() => toggle(inv.id)}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{inv.numero}</td>
                    <td>{inv.cliente}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{inv.empresa ?? '—'}</td>
                    <td>{inv.mes}</td>
                    <td className="text-right">{fmt(inv.monto)}</td>
                    <td><span className={`badge ${inv.nitStatus}`}>{inv.nitStatus}</span></td>
                    <td style={{ textAlign: 'center' }}>{inv.entregado ? '✅' : '—'}</td>
                  </tr>
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
