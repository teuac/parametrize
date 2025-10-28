import { useState } from 'react';
import { theme } from '../theme';
import Sidebar from '../components/Sidebar';
import { api } from '../api/http';
import { UploadCloud, X } from 'lucide-react';

export default function Import() {
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedFile(file);
    setError(null);
  };

  const processFile = async () => {
    if (!selectedFile) return;
    setError(null);
    try {
      setLoading(true);
      // read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // send to backend using axios instance (handles baseURL and auth)
      const resp = await api.post('/util/import-ncm', { filename: selectedFile.name, data: base64 }, { responseType: 'blob' });

      const blob = resp.data;
      // trigger download of returned workbook
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // preserve original filename with suffix
      const outName = (selectedFile.name || 'import').replace(/\.xlsx?$/i, '') + '_completado.xlsx';
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
  // reset selected file after successful download
  setSelectedFile(null);
  setFileName('');
  // clear the hidden file input so user can select the same file again without reloading
  const input = document.getElementById('file-input');
  if (input) input.value = '';
    } catch (err) {
      console.error('Erro ao importar planilha:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileName('');
    setError(null);
    const input = document.getElementById('file-input');
    if (input) input.value = '';
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.bg, color: theme.colors.text }}>
      <Sidebar />
      <div style={{ marginLeft: 240, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          width: '560px',
          borderRadius: 10,
          padding: 0,
          background: '#0b0b0b',
          border: `2px solid ${theme.colors.accent}`,
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
        }}>
          <div style={{ background: theme.colors.accent, padding: '12px 18px', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', justifyContent: 'center' }}>
            <h3 style={{ margin: 0, color: '#111', textAlign: 'center' }}>Importação</h3>
          </div>
          <div style={{ padding: 18, color: '#fff' }}>
            <p style={{ marginTop: 0, marginBottom: 12, textAlign: 'center' }}>Carregue aqui a sua planilha</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />

              <button
                onClick={() => document.getElementById('file-input').click()}
                title="Carregar planilha"
                aria-label="Carregar planilha"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: theme.colors.accent,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 22px rgba(0,0,0,0.45)'
                }}
                disabled={loading}
              >
                <UploadCloud color="#111" size={34} />
              </button>
              {fileName && (
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <div>Arquivo: {fileName}</div>
                  <button
                    onClick={removeFile}
                    style={{
                      marginTop: 6,
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.accent,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13
                    }}
                  >
                    <X color={theme.colors.accent} size={14} /> Remover arquivo
                  </button>
                </div>
              )}

              <button
                onClick={processFile}
                style={{
                  padding: '10px 16px',
                  background: theme.colors.accent,
                  color: '#111',
                  border: 'none',
                  borderRadius: 8,
                  cursor: selectedFile ? 'pointer' : 'not-allowed',
                  minWidth: 160,
                  textAlign: 'center',
                  opacity: loading || !selectedFile ? 0.65 : 1,
                  boxShadow: loading || !selectedFile ? 'none' : '0 6px 18px rgba(0,0,0,0.35)'
                }}
                disabled={loading || !selectedFile}
              >
                {loading ? 'Processando...' : 'Processar'}
              </button>

              {error && <div style={{ marginTop: 8, color: '#ff8b8b', textAlign: 'center' }}>{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}