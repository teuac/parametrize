import { useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import Sidebar from '../components/Sidebar';
import { api } from '../api/http';

export default function DownloadModelo() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // auto-download on mount
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get('/util/download-modelo', { responseType: 'blob' });
        const blob = resp.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_importacao.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setReady(true);
      } catch (err) {
        console.error('Erro ao baixar modelo:', err);
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const retry = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get('/util/download-modelo', { responseType: 'blob' });
      const blob = resp.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modelo_importacao.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setReady(true);
    } catch (err) {
      console.error('Erro ao baixar modelo:', err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.bg, color: theme.colors.text }}>
      <Sidebar />
      <div style={{ marginLeft: 240, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 560, borderRadius: 10, padding: 0, background: theme.colors.surface, border: `2px solid ${theme.colors.accent}`, boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ background: theme.colors.accent, padding: '12px 18px', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', justifyContent: 'center' }}>
            <h3 style={{ margin: 0, color: '#111', textAlign: 'center' }}>Download de Modelo</h3>
          </div>
          <div style={{ padding: 18, color: theme.colors.text }}>
            <p style={{ marginTop: 0, marginBottom: 12, textAlign: 'center', color: theme.colors.text }}>Clique no botão abaixo para baixar o arquivo modelo de importação.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={retry} disabled={loading} style={{ padding: '10px 14px', background: theme.colors.accent, color: '#111', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                {loading ? 'Baixando...' : ready ? 'Baixar novamente' : 'Baixar Modelo'}
              </button>
            </div>
            {error && <div style={{ marginTop: 12, color: '#ff8b8b', textAlign: 'center' }}>{error}</div>}
            {ready && !error && <div style={{ marginTop: 12, color: '#aaa', textAlign: 'center' }}>Arquivo baixado com sucesso.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
