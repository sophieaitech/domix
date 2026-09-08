'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useCourierSession } from '../context/CourierSessionProvider';

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useCourierSession();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loading && session) {
    router.replace('/home');
    return null;
  }

  const fullPhone = () => (phone.startsWith('+') ? phone : `+57${phone.replace(/\D/g, '')}`);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone() });
    setBusy(false);
    if (error) return setError(error.message);
    setStep('otp');
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone(), token: otp, type: 'sms' });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace('/home');
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px', gap: 24 }}>
      <div>
        <div style={{ font: '800 26px Manrope,sans-serif', color: 'var(--navy)' }}>Domix</div>
        <div style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)', marginTop: 4 }}>Mensajería &amp; Logística — App de repartidores</div>
      </div>

      {step === 'phone' ? (
        <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ font: '600 12px Manrope,sans-serif', color: 'var(--mu)' }}>Número de celular</label>
          <input
            required
            type="tel"
            placeholder="315 792 4906"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--sf)', border: '1px solid var(--bd)', font: '600 15px Manrope,sans-serif' }}
          />
          {error && <div style={{ color: 'var(--red)', font: '600 12px Manrope,sans-serif' }}>{error}</div>}
          <button
            type="submit"
            disabled={busy}
            style={{ padding: '14px', borderRadius: 14, background: 'var(--navy)', color: '#fff', font: '700 14px Manrope,sans-serif' }}
          >
            {busy ? 'Enviando código…' : 'Enviar código'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ font: '600 12px Manrope,sans-serif', color: 'var(--mu)' }}>Código enviado por SMS a {fullPhone()}</label>
          <input
            required
            inputMode="numeric"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--sf)', border: '1px solid var(--bd)', font: '600 15px Manrope,sans-serif', letterSpacing: '4px' }}
          />
          {error && <div style={{ color: 'var(--red)', font: '600 12px Manrope,sans-serif' }}>{error}</div>}
          <button
            type="submit"
            disabled={busy}
            style={{ padding: '14px', borderRadius: 14, background: 'var(--green)', color: '#fff', font: '700 14px Manrope,sans-serif' }}
          >
            {busy ? 'Verificando…' : 'Ingresar'}
          </button>
          <button type="button" onClick={() => setStep('phone')} style={{ font: '600 12px Manrope,sans-serif', color: 'var(--mu)' }}>
            Cambiar número
          </button>
        </form>
      )}
    </div>
  );
}
