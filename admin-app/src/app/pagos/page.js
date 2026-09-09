'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import TopBar from '../../components/TopBar';
import GuiaSeccion from '../../components/GuiaSeccion';
import { Icon, Card, Overline, Button, Pill, Field, EmptyState, Spinner } from '../../components/ui';
import { useAppMode } from '../../context/AppModeProvider';
import {
  fetchRetiros, resolverRetiro, fetchDocumentos, revisarDocumento, enlaceDocumento,
  ESTADO_RETIRO, METODOS, DOC_LABEL, DOC_ESTADO, money, haceCuanto,
} from '../../lib/pagos';

/* Ventana para consignar un retiro. Se pide la referencia porque es lo
   único que le sirve al repartidor cuando pregunta "¿y mi plata?". */
function Consignar({ retiro, onClose, onListo }) {
  const [ref, setRef] = useState('');
  const [nota, setNota] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resolver = async (estado) => {
    if (estado === 'paid' && !ref.trim()) return setError('Escribe la referencia de la consignación.');
    setBusy(true);
    setError('');
    const { error: err } = await resolverRetiro(retiro.id, estado, ref.trim(), nota.trim());
    setBusy(false);
    if (err) return setError(err.message);
    onListo();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button aria-label="Cerrar" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(6,10,16,.58)', backdropFilter: 'blur(4px)' }} />
      <Card elevation={3} style={{ position: 'relative', width: 'min(440px,100%)', padding: 22, animation: 'trUp .26s cubic-bezier(.2,.8,.2,1) both' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="dsp" style={{ display: 'block', font: '800 19px Manrope,sans-serif', letterSpacing: '-.03em' }}>
              Pagarle a {retiro.first_name}
            </span>
            <span style={{ display: 'block', font: '500 12.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 3 }}>
              {METODOS[retiro.method] || retiro.method || 'Cuenta'} · {retiro.account}
            </span>
          </span>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="close" size={18} color="var(--mu)" />
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '6px 0 20px' }}>
          <div className="num" style={{ font: '800 38px "IBM Plex Mono",monospace', letterSpacing: '-.03em' }}>{money(retiro.amount)}</div>
          <div style={{ font: '500 11.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 4 }}>
            Solicitado {haceCuanto(retiro.requested_at)}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 13 }}>
          <Field label="Referencia de la consignación" icon="receipt" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="NEQUI-88214" />
          <Field label="Nota (opcional)" icon="edit_note" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Se consignó el viernes en el corte de la tarde" />
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--redS)' }}>
            <Icon name="error" size={17} fill color="var(--red)" />
            <span style={{ flex: 1, font: '600 12px Manrope,sans-serif', color: 'var(--red)', lineHeight: 1.45 }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
          <Button variant="ghost" color="var(--red)" onClick={() => resolver('rejected')} disabled={busy} style={{ flex: 'none' }}>
            Negar
          </Button>
          <span style={{ flex: 1 }} />
          <Button icon="check" onClick={() => resolver('paid')} disabled={busy}>
            {busy ? 'Guardando…' : 'Marcar consignado'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* Revisión de un documento: se mira el archivo y se aprueba o se
   rechaza diciendo por qué, para que el repartidor sepa qué corregir. */
function RevisarDoc({ doc, nombre, onClose, onListo }) {
  const [url, setUrl] = useState(null);
  const [nota, setNota] = useState(doc.review_notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { enlaceDocumento(doc.storage_path).then(setUrl); }, [doc.storage_path]);

  const revisar = async (estado) => {
    if (estado === 'rejected' && !nota.trim()) return setError('Dile por qué se rechaza, para que lo pueda corregir.');
    setBusy(true);
    setError('');
    const { error: err } = await revisarDocumento(doc.id, estado, nota.trim());
    setBusy(false);
    if (err) return setError(err.message);
    onListo();
  };

  const esPdf = (doc.storage_path || '').toLowerCase().endsWith('.pdf');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button aria-label="Cerrar" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(6,10,16,.58)', backdropFilter: 'blur(4px)' }} />
      <Card elevation={3} style={{ position: 'relative', width: 'min(560px,100%)', maxHeight: '88vh', overflowY: 'auto', padding: 22, animation: 'trUp .26s cubic-bezier(.2,.8,.2,1) both' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="dsp" style={{ display: 'block', font: '800 19px Manrope,sans-serif', letterSpacing: '-.03em' }}>
              {DOC_LABEL[doc.doc_type] || doc.doc_type}
            </span>
            <span style={{ display: 'block', font: '500 12.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 3 }}>
              {nombre} · subida {haceCuanto(doc.uploaded_at || doc.created_at)}
            </span>
          </span>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="close" size={18} color="var(--mu)" />
          </button>
        </div>

        <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--sf)', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!url ? (
            <Spinner />
          ) : esPdf ? (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 40 }}>
              <Icon name="picture_as_pdf" size={40} color="var(--mu)" />
              <span style={{ font: '700 13px Manrope,sans-serif', color: 'var(--green)' }}>Abrir el PDF</span>
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={DOC_LABEL[doc.doc_type]} style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }} />
          )}
        </div>

        {doc.expires_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, font: '600 12px Manrope,sans-serif', color: 'var(--mu)' }}>
            <Icon name="event" size={16} color="var(--mu)" />
            Vence el {new Date(`${doc.expires_at}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <Field label="Nota para el repartidor" icon="edit_note" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="La foto salió movida, tómala de nuevo con buena luz" />
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 13, padding: 12, borderRadius: 10, background: 'var(--redS)' }}>
            <Icon name="error" size={17} fill color="var(--red)" />
            <span style={{ flex: 1, font: '600 12px Manrope,sans-serif', color: 'var(--red)', lineHeight: 1.45 }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
          <Button variant="ghost" color="var(--red)" onClick={() => revisar('rejected')} disabled={busy} style={{ flex: 'none' }}>
            Rechazar
          </Button>
          <span style={{ flex: 1 }} />
          <Button icon="verified" onClick={() => revisar('approved')} disabled={busy}>
            {busy ? 'Guardando…' : 'Aprobar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function PagosPage() {
  const { isDemo } = useAppMode();
  const [retiros, setRetiros] = useState([]);
  const [docs, setDocs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagando, setPagando] = useState(null);
  const [revisando, setRevisando] = useState(null);
  const [pestana, setPestana] = useState('retiros');

  const recargar = useCallback(async () => {
    if (isDemo) { setCargando(false); return; }
    setCargando(true);
    const [r, d] = await Promise.all([fetchRetiros(), fetchDocumentos()]);
    setRetiros(r);
    setDocs(d);
    setCargando(false);
  }, [isDemo]);

  useEffect(() => { recargar(); }, [recargar]);

  const porPagar = useMemo(() => retiros.filter((r) => r.status === 'pending'), [retiros]);
  const resueltos = useMemo(() => retiros.filter((r) => r.status !== 'pending'), [retiros]);
  const porRevisar = useMemo(() => docs.filter((d) => d.status === 'pending'), [docs]);
  const revisados = useMemo(() => docs.filter((d) => d.status !== 'pending'), [docs]);

  const totalPorPagar = porPagar.reduce((s, r) => s + Number(r.amount || 0), 0);
  const pagadoTotal = resueltos.filter((r) => r.status === 'paid').reduce((s, r) => s + Number(r.amount || 0), 0);

  /* Los documentos llegan sin el nombre de quien los subió: el join se
     arma con lo que ya trajo la vista de retiros cuando se puede. */
  const nombrePorId = useMemo(() => {
    const m = new Map();
    for (const r of retiros) m.set(r.courier_id, `${r.first_name || ''} ${r.last_name || ''}`.trim());
    return m;
  }, [retiros]);

  const kpis = [
    { icon: 'account_balance_wallet', tono: 'amber', valor: money(totalPorPagar), label: 'Por consignar', pista: `${porPagar.length} ${porPagar.length === 1 ? 'solicitud' : 'solicitudes'}` },
    { icon: 'task_alt', tono: 'green', valor: money(pagadoTotal), label: 'Ya consignado', pista: 'Histórico' },
    { icon: 'fact_check', tono: 'navy', valor: porRevisar.length, label: 'Documentos por revisar', pista: porRevisar.length ? 'Alguien está esperando' : 'Todo al día' },
  ];

  return (
    <>
      <TopBar
        title="Pagos y documentos"
        subtitle="Lo que la calle está esperando de la oficina: su plata y su habilitación."
        actions={<Button variant="ghost" icon="refresh" onClick={recargar} style={{ height: 44 }}>Actualizar</Button>}
      />

      <div className="dx-content sb" style={{ animation: 'trFade .3s ease' }}>
        <GuiaSeccion
          id="pagos"
          tono="amber"
          titulo="Aquí se le paga y se le habilita a la calle"
          frase="Un repartidor con la plata retenida o el SOAT sin aprobar deja de trabajar. Esta pantalla existe para que eso no pase de un día."
          puntos={[
            { i: 'account_balance_wallet', t: 'Consignar', s: 'Con su referencia' },
            { i: 'fact_check', t: 'Revisar papeles', s: 'Aprobar o devolver' },
            { i: 'lock', t: 'Enlaces que caducan', s: 'Las cédulas no quedan públicas' },
          ]}
        />

        {isDemo && (
          <Card style={{ padding: 16, marginBottom: 16, borderLeft: '3px solid var(--amber)' }}>
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <Icon name="science" size={20} color="var(--amber)" />
              <span style={{ flex: 1, font: '500 12.5px/1.55 Manrope,sans-serif', color: 'var(--mu)' }}>
                Estás en modo demostración. Los retiros y documentos reales aparecen al pasar a modo en vivo.
              </span>
            </div>
          </Card>
        )}

        {/* Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14, marginBottom: 18 }}>
          {kpis.map((k) => (
            <Card key={k.label} style={{ padding: 17 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: `var(--${k.tono}S)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={k.icon} size={20} fill color={`var(--${k.tono})`} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="num" style={{ display: 'block', font: '800 22px Manrope,sans-serif', letterSpacing: '-.03em' }}>{k.valor}</span>
                  <span style={{ display: 'block', font: '600 11px Manrope,sans-serif', color: 'var(--mu)', marginTop: 2 }}>{k.label}</span>
                </span>
              </div>
              <div style={{ font: '500 11px Manrope,sans-serif', color: 'var(--mu)', marginTop: 11 }}>{k.pista}</div>
            </Card>
          ))}
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
          {[
            { id: 'retiros', label: 'Retiros', n: porPagar.length },
            { id: 'documentos', label: 'Documentos', n: porRevisar.length },
          ].map((t) => {
            const on = pestana === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setPestana(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 99,
                  font: '700 12.5px Manrope,sans-serif',
                  background: on ? 'var(--inv)' : 'var(--sf)',
                  color: on ? 'var(--invtx)' : 'var(--mu)',
                }}
              >
                {t.label}
                {t.n > 0 && (
                  <span className="num" style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, background: on ? 'rgba(255,255,255,.22)' : 'var(--amberS)', color: on ? 'var(--invtx)' : 'var(--amber)', font: '700 10px "IBM Plex Mono",monospace', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {cargando && <Spinner />}

        {/* ---------- Retiros ---------- */}
        {!cargando && pestana === 'retiros' && (
          <>
            {porPagar.length === 0 && resueltos.length === 0 && (
              <EmptyState
                icon="account_balance_wallet"
                title="Nadie ha pedido retiro"
                body="Cuando un repartidor solicite su plata desde el app, aparece aquí para que la consignes."
              />
            )}

            {porPagar.length > 0 && (
              <>
                <Overline style={{ color: 'var(--mu)', marginBottom: 9 }}>Esperando su plata</Overline>
                <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
                  {porPagar.map((r) => (
                    <Card key={r.id} style={{ padding: 16, borderLeft: '3px solid var(--amber)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--amberS)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 14px Manrope,sans-serif', color: 'var(--amber)', flex: 'none' }}>
                          {(r.first_name?.[0] || 'R').toUpperCase()}
                        </span>
                        <span style={{ flex: 1, minWidth: 150 }}>
                          <span style={{ display: 'block', font: '800 15px Manrope,sans-serif' }}>{r.first_name} {r.last_name}</span>
                          <span style={{ display: 'block', font: '500 12px Manrope,sans-serif', color: 'var(--mu)', marginTop: 2 }}>
                            {METODOS[r.method] || r.method || 'Sin método'} · {r.account} · {haceCuanto(r.requested_at)}
                          </span>
                        </span>
                        <span className="num" style={{ font: '800 21px "IBM Plex Mono",monospace', letterSpacing: '-.02em' }}>{money(r.amount)}</span>
                        <Button icon="send_money" onClick={() => setPagando(r)}>Consignar</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {resueltos.length > 0 && (
              <>
                <Overline style={{ color: 'var(--mu)', marginBottom: 9 }}>Ya resueltos</Overline>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  {resueltos.map((r, i) => {
                    const st = ESTADO_RETIRO[r.status] || ESTADO_RETIRO.paid;
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 17px', borderTop: i ? '1px solid var(--bd2)' : 'none' }}>
                        <Icon name={st.icon} size={19} fill color={`var(--${st.tono})`} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', font: '700 13.5px Manrope,sans-serif' }}>{r.first_name} {r.last_name}</span>
                          <span style={{ display: 'block', font: '500 11.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>
                            {new Date(r.resolved_at || r.requested_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                            {r.reference ? ` · ${r.reference}` : ''}
                          </span>
                        </span>
                        <Pill tone={st.tono}>{st.label}</Pill>
                        <span className="num" style={{ font: '800 15px "IBM Plex Mono",monospace', minWidth: 86, textAlign: 'right' }}>{money(r.amount)}</span>
                      </div>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}

        {/* ---------- Documentos ---------- */}
        {!cargando && pestana === 'documentos' && (
          <>
            {docs.length === 0 && (
              <EmptyState
                icon="fact_check"
                title="Nadie ha subido papeles"
                body="Cuando un repartidor suba su cédula, licencia o SOAT desde el app, te llega aquí para revisarlo."
              />
            )}

            {porRevisar.length > 0 && (
              <>
                <Overline style={{ color: 'var(--mu)', marginBottom: 9 }}>Esperando tu visto bueno</Overline>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 12, marginBottom: 22 }}>
                  {porRevisar.map((d) => (
                    <Card key={d.id} style={{ padding: 15, borderLeft: '3px solid var(--amber)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--amberS)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                          <Icon name="description" size={19} color="var(--amber)" />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', font: '800 13.5px Manrope,sans-serif' }}>{DOC_LABEL[d.doc_type] || d.doc_type}</span>
                          <span style={{ display: 'block', font: '500 11.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 2 }}>
                            {nombrePorId.get(d.courier_id) || 'Repartidor'} · {haceCuanto(d.uploaded_at || d.created_at)}
                          </span>
                        </span>
                      </div>
                      <Button full icon="visibility" variant="ghost" onClick={() => setRevisando(d)} style={{ marginTop: 12 }}>
                        Revisar
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {revisados.length > 0 && (
              <>
                <Overline style={{ color: 'var(--mu)', marginBottom: 9 }}>Ya revisados</Overline>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  {revisados.map((d, i) => {
                    const st = DOC_ESTADO[d.status] || DOC_ESTADO.pending;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setRevisando(d)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 17px', borderTop: i ? '1px solid var(--bd2)' : 'none', textAlign: 'left', background: 'transparent' }}
                      >
                        <Icon name={st.icon} size={19} fill color={`var(--${st.tono})`} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', font: '700 13.5px Manrope,sans-serif' }}>{DOC_LABEL[d.doc_type] || d.doc_type}</span>
                          <span style={{ display: 'block', font: '500 11.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>
                            {nombrePorId.get(d.courier_id) || 'Repartidor'}
                            {d.expires_at ? ` · vence ${new Date(`${d.expires_at}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })}` : ''}
                          </span>
                        </span>
                        <Pill tone={st.tono}>{st.label}</Pill>
                        <Icon name="chevron_right" size={18} color="var(--mu)" />
                      </button>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {pagando && (
        <Consignar retiro={pagando} onClose={() => setPagando(null)} onListo={() => { setPagando(null); recargar(); }} />
      )}
      {revisando && (
        <RevisarDoc
          doc={revisando}
          nombre={nombrePorId.get(revisando.courier_id) || 'Repartidor'}
          onClose={() => setRevisando(null)}
          onListo={() => { setRevisando(null); recargar(); }}
        />
      )}
    </>
  );
}
