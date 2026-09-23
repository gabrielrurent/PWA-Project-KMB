'use client';

import { useEffect } from 'react';
import { useDaring } from '../pwa/useDaring.js';
import { adaIndexedDb, simpanKv } from '../pwa/simpanan.js';

export interface AkuRingkas {
  mechanicId: number;
  peran: 'mechanic' | 'supervisor' | 'superintendent';
  nama: string;
}

export function DaftarSW({ aku }: { aku: AkuRingkas | null }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    if (!adaIndexedDb()) return;
    void (async () => {
      try {
        await simpanKv('aku', aku);
      } catch {}
    })();
  }, [aku]);

  return <BarisKeadaan />;
}

function BarisKeadaan() {
  const { daring, antre, umurHari, dorong, sibuk } = useDaring();

  if (daring && antre === 0) return null;

  const menua = umurHari >= 3;

  return (
    <div className={`pita-luring${menua ? ' pita-luring-bahaya' : ''}`} role="status">
      {!daring && <span>📴 Tidak ada sinyal</span>}
      {antre > 0 && (
        <>
          <span>📮 {antre} belum terkirim</span>
          {menua && (
            <strong>
              — tertua {Math.floor(umurHari)} hari. Cari sinyal, jangan tunggu lagi.
            </strong>
          )}
          {daring && (
            <button type="button" className="pita-luring-tombol" disabled={sibuk} onClick={() => void dorong()}>
              {sibuk ? 'Mengirim…' : 'Kirim sekarang'}
            </button>
          )}
        </>
      )}
      {!daring && antre === 0 && (
        <span className="pita-luring-samar">
          Data aman di antrean, terkirim otomatis saat ada sinyal.
        </span>
      )}
    </div>
  );
}
