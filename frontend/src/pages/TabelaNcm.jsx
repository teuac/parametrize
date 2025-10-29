import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';
import Sidebar from '../components/Sidebar';

const Layout = styled.div`
  display:flex;
  min-height:100vh;
  background: #0b0b0b;
  color: #f5f5f5;
`;

const Content = styled.div`
  flex:1;
  padding: 24px 24px 60px 260px; /* leave space for sidebar */
`;

const SearchRow = styled.div`
  display:flex;
  gap:8px;
  margin-bottom:12px;
  align-items:center;
`;

const Input = styled.input`
  padding:8px 10px;
  border-radius:6px;
  border:1px solid #ccc;
  min-width:220px;
`;

const Button = styled.button`
  padding:8px 12px;
  border-radius:6px;
  background:#a8892a; /* system yellow */
  color:#0b0b0b;
  border:none;
  cursor:pointer;
  font-weight:600;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate; /* Changed from collapse to separate for rounded corners */
  border-spacing: 0;
  border-radius: 8px; /* Added rounded corners to the table */
  overflow: hidden;
  border: 1px solid #a8892a; /* system yellow border around the table */
  font-size: 0.95rem;
  table-layout: fixed; /* prevent columns from stretching too far; allow wrapping in cells */
`;
const Th = styled.th`
  text-align: left;
  padding: 8px 16px; /* Standardized horizontal padding */
  background: #a8892a; /* system yellow */
  color: #0b0b0b;
  border-bottom: 1px solid #e6e6e6;
`;
const Td = styled.td`
  padding: 8px 16px; /* Standardized horizontal padding */
  border-bottom: 1px solid #f0f0f0;
`;

const Highlight = styled.tr`
  background: rgba(168,137,42,0.08);
`;

export default function TabelaNcm() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [windowStart, setWindowStart] = useState(0);
  const pageSize = 21; // rows to show around the found item (odd so item can be centered)
  const tableRef = useRef(null);
  const targetRef = useRef(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/util/tabela-ncm')
      .then(res => {
        if (!mounted) return;
        const data = res.data?.rows || [];
        setRows(data);
        setLoading(false);
      })
      .catch(err => {
        setMessage('Erro ao carregar tabela NCM');
        setLoading(false);
        console.error(err);
      });
    return () => { mounted = false };
  }, []);

  function locateByCodigo() {
    setMessage(null);
    if (!query) return setMessage('Informe um código para localizar');
    // normalize: ignore dots in both stored code and query
    const normalize = (s) => String(s || '').toLowerCase().replace(/\./g, '').trim();
    // try exact match first, then startsWith
    const idx = rows.findIndex(r => normalize(r.codigo) === normalize(query));
    const idx2 = rows.findIndex(r => normalize(r.codigo).startsWith(normalize(query)));
    const found = idx >= 0 ? idx : idx2;
    if (found < 0) {
      setMessage('Código não encontrado');
      return;
    }
    const half = Math.floor(pageSize / 2);
    let start = Math.max(0, found - half);
    if (start + pageSize > rows.length) start = Math.max(0, rows.length - pageSize);
    setWindowStart(start);

    // scroll to the highlighted row after render
    setTimeout(() => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  }

  const visible = rows.slice(windowStart, windowStart + pageSize);

  return (
    <Layout>
      <Sidebar />
      <Content>
        <h2>Tabela NCM</h2>
        <p>Localizar por código: informe o código NCM e o sistema levará você até a linha correspondente mostrando linhas antes e depois.</p>
        <SearchRow>
          <Input placeholder="Código (ex: 01012100)" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') locateByCodigo(); }} />
          <Button onClick={locateByCodigo}>Localizar</Button>
          <Button onClick={() => { setWindowStart(0); setQuery(''); setMessage(null); }}>Voltar ao topo</Button>
          {message && <div style={{ color: '#a8892a', marginLeft: 12 }}>{message}</div>}
        </SearchRow>

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <>
            <div style={{ overflow: 'auto', maxHeight: '70vh' }} ref={tableRef}>
              <Table>
                <thead>
                  <tr>
                    <Th style={{ width: 160 }}>Código</Th>
                    <Th>Descrição</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => {
                    const globalIndex = windowStart + i;
                    const normalize = (s) => String(s || '').toLowerCase().replace(/\./g, '').trim();
                    const isTarget = query && normalize(String(r.codigo)).startsWith(normalize(query));
                    const RowTag = isTarget ? Highlight : 'tr';
                    return (
                      <RowTag key={globalIndex} ref={isTarget ? targetRef : null}>
                        <Td>{String(r.codigo || '').trim()}</Td>
                        <Td style={{ paddingLeft: '12px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.descricao || r['descricao do produto'] || r['descricao_produto'] || r['descricao_completa'] || ''}</Td>
                      </RowTag>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {/* Pagination and info moved outside the scrollable table area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div>
                <Button onClick={() => setWindowStart(Math.max(0, windowStart - pageSize))} disabled={windowStart === 0}>Anterior</Button>
                <Button onClick={() => setWindowStart(Math.min(rows.length - pageSize, windowStart + pageSize))} style={{ marginLeft: 8 }} disabled={windowStart + pageSize >= rows.length}>Próximo</Button>
              </div>
              <div style={{ color: '#666' }}>{rows.length} linhas — mostrando {Math.min(pageSize, rows.length - windowStart)} a partir da linha {windowStart + 1}</div>
            </div>
          </>
        )}
      </Content>
    </Layout>
  );
}
