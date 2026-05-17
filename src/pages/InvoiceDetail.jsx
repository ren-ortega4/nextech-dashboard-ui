import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvoice, updateInvoice, uploadRetiro, deleteRetiro } from '../api';
import { useToast } from '../store';

const STATUSES = ['pendiente','pagada','vencida','revision','anulada'];

function fmt(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n ?? 0);
}

export default function InvoiceDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { show } = useToast();
  const fileRef  = useRef();
  const [over, setOver] = useState(false);

  const { data: inv, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn:  () => fetchInvoice(id),
  });

  // ── Estado local del form ────────────────────────────────────────
  const [nitStatus, setNitStatus] = useState('');
  const effectiveStatus = nitStatus || inv?.status;

  // ── Mutation: cambio de estado ───────────────────────────────────
  const statusMut = useMutation({
    mutationFn: (body) => updateInvoice(id, body),
    onSuccess: () => {
      show('Estado actualizado', 'success');
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setNitStatus('');
    },
    onError: () => show('Error al actualizar', 'error'),
  });

  // ── Mutation: upload ─────────────────────────────────────────────
  const uploadMut = useMutation({
    mutationFn: (file) => uploadRetiro(id, file),
    onSuccess: () => {
      show('Archivo subido', 'success');
      qc.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: (err) => show(err.response?.data?.error ?? 'Error al subir archivo', 'error'),
  });

  // ── Mutation: delete ─────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (fileId) => deleteRetiro(id, fileId),
    onSuccess: () => {
      show('Archivo eliminado', 'success');
      qc.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: () => show('Error al eliminar archivo', 'error'),
  });

  const handleFiles = (files) => {
    [...files].forEach(f => uploadMut.mutate(f));
  };

  if (isLoading) return (
    <div className="page-body">
      <div className="skeleton" style={{ height: 40, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  );

  if (!inv) return <div className="page-body">Factura no encontrada.</div>;

  return (
    <>
      <div className="topbar">
        <div className="gap-8">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/facturas')}>
            ← Volver
          </button>
          <h1>{inv.numero}</h1>
          <span className={`badge ${inv.status}`}>{inv.status}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
          🖨 Imprimir
        </button>
      </div>

      <div className="page-body">
        <div className="detail-grid">

          {/* ── Info cliente ── */}
          <div className="detail-card">
            <h3>Datos del cliente</h3>
            {[
              ['Cliente',   inv.cliente],
              ['Empresa',   inv.empresa],
              ['RUT',       inv.rut],
              ['Giro',      inv.giro],
              ['Dirección', inv.direccion],
              ['Email',     inv.email],
            ].map(([k, v]) => v && (
              <div className="info-row" key={k}>
                <span className="key">{k}</span>
                <span className="val">{v}</span>
              </div>
            ))}
          </div>

          {/* ── Info factura ── */}
          <div className="detail-card">
            <h3>Información de la factura</h3>
            {[
              ['N° Factura',  inv.numero],
              ['Fecha',       inv.fecha],
              ['Vencimiento', inv.vencimiento],
              ['Mes',         inv.mes],
            ].map(([k, v]) => v && (
              <div className="info-row" key={k}>
                <span className="key">{k}</span>
                <span className="val">{v}</span>
              </div>
            ))}
            <div className="info-row"><span className="key">Neto</span><span className="val">{fmt(inv.neto)}</span></div>
            <div className="info-row"><span className="key">IVA 19%</span><span className="val">{fmt(inv.iva)}</span></div>
            <div className="info-row" style={{ fontWeight: 700 }}>
              <span className="key">Total</span><span className="val">{fmt(inv.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Items ── */}
        {inv.items?.length > 0 && (
          <div className="detail-card" style={{ marginBottom: 20 }}>
            <h3>Productos / Servicios</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'center' }}>Cant.</th>
                  <th className="text-right">Precio unit.</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.desc}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td className="text-right">{fmt(item.price)}</td>
                    <td className="text-right">{fmt(item.total)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={3} className="text-right">Total</td>
                  <td className="text-right">{fmt(inv.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="detail-grid">

          {/* ── Cambiar estado ── */}
          <div className="detail-card">
            <h3>Cambiar estado</h3>
            <div className="gap-8" style={{ marginTop: 8 }}>
              <select
                value={effectiveStatus}
                onChange={e => setNitStatus(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--border)', fontSize: 13 }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                className="btn btn-primary btn-sm"
                disabled={statusMut.isPending || nitStatus === '' || nitStatus === inv.status}
                onClick={() => statusMut.mutate({ nitStatus: effectiveStatus })}
              >
                {statusMut.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>

            <div className="gap-8" style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inv.entregado ?? false}
                  onChange={e => statusMut.mutate({ entregado: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Marcar como entregado
              </label>
            </div>
          </div>

          {/* ── Historial ── */}
          <div className="detail-card">
            <h3>Historial</h3>
            {inv.history?.length === 0
              ? <p className="text-muted" style={{ fontSize: 13 }}>Sin registros</p>
              : <div className="history-list">
                {inv.history?.map((h, i) => (
                  <div className="history-item" key={i}>
                    <div className="history-dot" />
                    <div className="history-text">
                      <div dangerouslySetInnerHTML={{ __html: h.text }} />
                      <div className="history-time">{h.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

        {/* ── Archivos de retiro ── */}
        <div className="detail-card" style={{ marginTop: 20 }}>
          <h3>Documentos de retiro</h3>

          {/* Drop zone */}
          <div
            className={`drop-zone ${over ? 'over' : ''}`}
            style={{ marginTop: 12 }}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current.click()}
          >
            <div style={{ fontSize: 28 }}>📁</div>
            <p>Arrastra archivos aquí o haz clic para seleccionar</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG, WebP, PDF — máx 10 MB</p>
            <input
              ref={fileRef} type="file" hidden multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {uploadMut.isPending && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Subiendo…</p>
          )}

          {/* Lista de archivos */}
          {inv.retiroFiles?.length > 0 && (
            <div className="file-list">
              {inv.retiroFiles.map(f => (
                <div className="file-chip" key={f.id}>
                  <span>{f.type === 'application/pdf' ? '📄' : '🖼'}</span>
                  <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{f.size}</span>
                  <button onClick={() => deleteMut.mutate(f.id)} title="Eliminar">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
