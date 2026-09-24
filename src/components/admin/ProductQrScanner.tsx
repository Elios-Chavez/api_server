import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { Camera, QrCode, ScanLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = { onScan: (code: string) => void; busy?: boolean };

export function ProductQrScanner({ onScan, busy = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [open, setOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');

  const resolve = (code: string) => {
    const value = code.trim();
    if (!value) return;
    setError('');
    setManualCode('');
    onScan(value);
  };

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setOpen(false);
  };

  useEffect(() => () => {
    controlsRef.current?.stop();
  }, []);

  const start = async () => {
    if (!videoRef.current) return;
    setError('');
    setOpen(true);
    try {
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        videoRef.current,
        (result) => {
          if (!result) return;
          resolve(result.getText());
          stop();
        },
      );
    } catch {
      stop();
      setError('No fue posible abrir o leer la cámara. Revisa el permiso del navegador o usa el campo manual.');
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualCode.trim()) return;
    resolve(manualCode);
  };

  const paste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const value = event.clipboardData.getData('text').trim();
    if (!value) return;
    event.preventDefault();
    resolve(value);
  };

  return <section className="product-qr-panel" aria-label="Escanear producto">
    <div className="product-qr-copy"><div className="product-qr-icon"><QrCode aria-hidden="true" size={22}/></div><div><p className="section-label">Entrada rápida</p><h2>Agregar o editar desde QR</h2><p>Escanea el producto y sus datos se cargarán directamente en el formulario.</p></div></div>
    <div className="product-qr-actions"><button className="secondary-button" disabled={busy || open} onClick={() => void start()} type="button"><Camera aria-hidden="true" size={17}/>{open ? 'Cámara activa…' : 'Abrir cámara'}</button>{open && <button className="icon-button" onClick={stop} type="button">Cerrar</button>}</div>
    {open && <div className="product-qr-camera"><video aria-label="Vista de cámara para leer QR" autoPlay muted playsInline ref={videoRef}/><span><ScanLine aria-hidden="true" size={24}/>Alinea el QR dentro del encuadre</span></div>}
    <form className="product-qr-manual" onSubmit={submit}><label htmlFor="product-qr-code">Código QR manual <span>(respaldo de cámara)</span></label><div><input id="product-qr-code" onChange={(event) => setManualCode(event.target.value)} onPaste={paste} placeholder="Pega un ID o el contenido del QR" value={manualCode}/><button className="secondary-button" disabled={busy || !manualCode.trim()} type="submit">Cargar producto</button></div></form>
    {error && <p className="operation-error" role="alert">{error}</p>}
  </section>;
}
