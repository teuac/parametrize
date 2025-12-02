import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';
import Sidebar from '../components/Sidebar';

const Layout = styled.div`
  display:flex;
  min-height:100vh;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
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

const SmallButton = styled(Button)`
  padding: 6px 8px;
  font-size: 0.9rem;
  min-width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const RealceLabel = styled.div`
  color: #a8892a;
  font-size: 13px;
  min-width: 90px;
  text-align: center;
  font-weight: 700;
`;

const RealcePercent = styled.span`
  margin-left: 6px;
  font-size: 14px;
  font-weight: 800;
`;

const Highlight = styled.tr`
  background: ${p => `rgba(168,137,42,${p.intensity})`} ;
  box-shadow: ${p => `inset 6px 0 0 0 rgba(168,137,42,${Math.min(0.95, p.intensity + 0.12)})`} ;
  transition: background 160ms ease, box-shadow 160ms ease;
`;

export default function TabelaNcm() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [field, setField] = useState('codigo');
  const [matches, setMatches] = useState([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [highlightIntensity, setHighlightIntensity] = useState(0.22);
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
    if (!query) return setMessage('Informe um código ou descrição para localizar');

    const normalizeText = (s) => {
      const str = String(s || '');
      return str
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[.,;:]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();
    };

    const normalizeCode = (s) => String(s || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, '').trim();

    const getFieldValue = (r) => {
      if (field === 'codigo') return r.codigo;
      return r.descricao || r['descricao do produto'] || r['descricao_produto'] || r['descricao_completa'] || '';
    };

    const qnorm = field === 'codigo' ? normalizeCode(query) : normalizeText(query);
    const foundIndices = [];
    rows.forEach((r, idx) => {
      const val = getFieldValue(r);
      const vnorm = field === 'codigo' ? normalizeCode(val) : normalizeText(val);
      if (!vnorm) return;
      if (vnorm.includes(qnorm)) foundIndices.push(idx);
    });

    if (!foundIndices.length) {
      setMatches([]);
      setCurrentMatchIdx(-1);
      setMessage('Nenhuma ocorrência encontrada');
      return;
    }

    setMatches(foundIndices);
    setCurrentMatchIdx(0);
    const first = foundIndices[0];
    const half = Math.floor(pageSize / 2);
    let start = Math.max(0, first - half);
    if (start + pageSize > rows.length) start = Math.max(0, rows.length - pageSize);
    setWindowStart(start);

    setTimeout(() => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  }

  function goToMatch(dir) {
    if (!matches.length) return;
    let next = currentMatchIdx + dir;
    if (next < 0) next = matches.length - 1;
    if (next >= matches.length) next = 0;
    setCurrentMatchIdx(next);
    const idx = matches[next];
    const half = Math.floor(pageSize / 2);
    let start = Math.max(0, idx - half);
    if (start + pageSize > rows.length) start = Math.max(0, rows.length - pageSize);
    setWindowStart(start);
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
          <select value={field} onChange={(e) => setField(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#0f0f0f', color: '#eee' }}>
            <option value="codigo">Código</option>
            <option value="descricao">Descrição</option>
          </select>
          <Input placeholder={field === 'codigo' ? 'Código (ex: 01012100)' : 'Descrição'} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') locateByCodigo(); }} />
          <Button onClick={locateByCodigo}>Localizar</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button onClick={() => goToMatch(-1)} disabled={!matches.length}>◀</Button>
            <div style={{ color: '#a8892a', minWidth: 80, textAlign: 'center' }}>{matches.length ? `${(currentMatchIdx >= 0 ? currentMatchIdx + 1 : 0)} / ${matches.length}` : '0 / 0'}</div>
            <Button onClick={() => goToMatch(1)} disabled={!matches.length}>▶</Button>
          </div>
          <Button onClick={() => { setWindowStart(0); setQuery(''); setMatches([]); setCurrentMatchIdx(-1); setMessage(null); }}>Voltar ao topo</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <RealceLabel>Realce:<RealcePercent>{(highlightIntensity * 100).toFixed(0)}%</RealcePercent></RealceLabel>
            <SmallButton onClick={() => setHighlightIntensity(i => Math.min(0.95, +(i + 0.08).toFixed(3)))}>+</SmallButton>
            <SmallButton onClick={() => setHighlightIntensity(i => Math.max(0.05, +(i - 0.08).toFixed(3)))}>−</SmallButton>
          </div>
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
                    const normalizeText = (s) => {
                      const str = String(s || '');
                      return str
                        .normalize('NFD')
                        .replace(/\p{Diacritic}/gu, '')
                        .replace(/[.,;:]/g, '')
                        .replace(/\s+/g, ' ')
                        .toLowerCase()
                        .trim();
                    };
                    const normalizeCode = (s) => String(s || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, '').trim();

                    const getFieldValue = (row) => {
                      if (field === 'codigo') return row.codigo;
                      return row.descricao || row['descricao do produto'] || row['descricao_produto'] || row['descricao_completa'] || '';
                    };

                    const fieldVal = getFieldValue(r);
                    const vnorm = field === 'codigo' ? normalizeCode(fieldVal) : normalizeText(fieldVal);
                    const isTarget = matches.length && matches[currentMatchIdx] === globalIndex;
                    if (isTarget) {
                      return (
                        <Highlight key={globalIndex} intensity={highlightIntensity} ref={targetRef}>
                          <Td>{String(r.codigo || '').trim()}</Td>
                          <Td style={{ paddingLeft: '12px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.descricao || r['descricao do produto'] || r['descricao_produto'] || r['descricao_completa'] || ''}</Td>
                        </Highlight>
                      );
                    }
                    return (
                      <tr key={globalIndex}>
                        <Td>{String(r.codigo || '').trim()}</Td>
                        <Td style={{ paddingLeft: '12px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.descricao || r['descricao do produto'] || r['descricao_produto'] || r['descricao_completa'] || ''}</Td>
                      </tr>
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
