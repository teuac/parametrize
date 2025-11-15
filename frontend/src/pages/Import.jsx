import { useState } from 'react';
import { useTheme } from 'styled-components';
import Sidebar from '../components/Sidebar';
import { api } from '../api/http';
import { UploadCloud, X } from 'lucide-react';

export default function Import() {
  const theme = useTheme();
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
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSamples, setDuplicateSamples] = useState([]);
  const [pendingBase64, setPendingBase64] = useState(null);
  const [pendingUniqueCount, setPendingUniqueCount] = useState(null);
  const [pendingRemaining, setPendingRemaining] = useState(null);

  const doImport = async (base64, maxProcess = null) => {
    try {
      setLoading(true);
      // send to backend using axios instance (handles baseURL and auth)
      const body = { filename: selectedFile.name, data: base64 };
      if (maxProcess) body.maxProcess = Number(maxProcess);
      const resp = await api.post('/util/import-ncm', body, { responseType: 'blob' });

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
      // notify other parts of the app (Dashboard) to refresh quota
      try { window.dispatchEvent(new CustomEvent('quota-changed')); } catch (e) {}
    } catch (err) {
      console.error('Erro ao importar planilha:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      setPendingBase64(null);
    }
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

      // Before processing, check for duplicate NCM codes in the uploaded sheet
      try {
        const checkResp = await api.post('/util/import-ncm/check', { filename: selectedFile.name, data: base64 });
        const duplicates = checkResp.data?.duplicates || [];
        const uniqueCount = Number(checkResp.data?.uniqueCount || 0);
        // fetch current quota
        let remaining = null;
        try {
          const q = await api.get('/util/quota');
          const used = q.data?.used || 0;
          const limit = q.data?.limit || 0;
          remaining = Math.max(0, limit - used);
        } catch (e) {
          // if quota fetch fails, allow processing but do not limit
          remaining = null;
        }

        // If there are duplicates OR uniqueCount exceeds remaining quota (when known), show modal
        const needModal = (duplicates.length > 0) || (remaining !== null && uniqueCount > remaining);
        if (needModal) {
          setDuplicateSamples(duplicates.slice(0, 20));
          setPendingBase64(base64);
          setPendingUniqueCount(uniqueCount);
          setPendingRemaining(remaining);
          setDuplicateModalOpen(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        // if check fails, continue to attempt processing but warn in console
        console.warn('Verificação de duplicatas falhou, prosseguindo com processamento', err);
      }

      // no duplicates found or check failed - proceed
      await doImport(base64);
    } catch (err) {
      console.error('Erro ao importar planilha:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setDuplicateModalOpen(false);
    setPendingBase64(null);
    setLoading(false);
  };

  const handleModalContinue = async () => {
    setDuplicateModalOpen(false);
    if (pendingBase64) {
      // if we know remaining and pendingUniqueCount exceeds it, pass maxProcess so backend limits processing
      if (pendingRemaining !== null && pendingUniqueCount > pendingRemaining) {
        await doImport(pendingBase64, pendingRemaining);
      } else {
        await doImport(pendingBase64);
      }
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
          background: theme.colors.surface,
          border: `2px solid ${theme.colors.accent}`,
          boxShadow: '0 6px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{ background: theme.colors.accent, padding: '12px 18px', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', justifyContent: 'center' }}>
            <h3 style={{ margin: 0, color: '#111', textAlign: 'center' }}>Importação</h3>
          </div>
          <div style={{ padding: 18, color: theme.colors.text }}>
            <p style={{ marginTop: 0, marginBottom: 12, textAlign: 'center', color: theme.colors.text }}>Carregue aqui a sua planilha</p>
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
            {duplicateModalOpen && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ width: 560, maxWidth: '92%', borderRadius: 10, background: theme.colors.surface, color: theme.colors.text, padding: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,82,82,0.12)' }} role="dialog" aria-modal="true">
                  <h3 style={{ marginTop: 0, marginBottom: 8, background: '#ff5252', color: '#000', padding: '8px 12px', borderRadius: 6, display: 'block', width: '100%', textAlign: 'center' }}>Códigos duplicados encontrados</h3>
                  <div style={{ marginTop: 0, marginBottom: 8 }}>
                    {pendingUniqueCount !== null && pendingRemaining !== null && pendingUniqueCount > pendingRemaining ? (
                      <p style={{ margin: 0 }}>A planilha possui <strong>{pendingUniqueCount}</strong> códigos únicos, e você tem <strong>{pendingRemaining}</strong> consultas restantes hoje. Serão processados apenas <strong>{pendingRemaining}</strong> códigos (os demais serão ignorados). Deseja continuar?</p>
                    ) : (
                      <p style={{ margin: 0 }}>A planilha possui códigos repetidos. Esses códigos duplicados serão ignorados durante o processamento.</p>
                    )}
                  </div>
                  {duplicateSamples && duplicateSamples.length > 0 && (
                    <div style={{ marginTop: 6, maxHeight: 140, overflow: 'auto', background: theme.name === 'light' ? '#f6f6f6' : '#111', padding: 10, borderRadius: 6, border: '1px solid rgba(255,82,82,0.06)', color: theme.colors.text }}>
                      {duplicateSamples.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                    <button onClick={handleModalCancel} style={{ padding: '8px 12px', borderRadius: 6, background: 'transparent', border: theme.name === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)', color: theme.colors.text, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleModalContinue} style={{ padding: '8px 12px', borderRadius: 6, background: '#c62828', border: 'none', color: '#fff', cursor: 'pointer' }}>Continuar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}