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
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #a8892a;
  font-size: 0.95rem;
`;
const Th = styled.th`
  text-align: left;
  padding: 8px 16px;
  background: #a8892a;
  color: #0b0b0b;
  border-bottom: 1px solid #e6e6e6;
`;
const Td = styled.td`
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const Highlight = styled.tr`
  background: rgba(168,137,42,0.08);
`;

export default function TabelaNbs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [field, setField] = useState('item_lc_116');
  const [matches, setMatches] = useState([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [windowStart, setWindowStart] = useState(0);
  const pageSize = 21;
  const tableRef = useRef(null);
  const targetRef = useRef(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/util/tabela-nbs')
      .then(res => {
        if (!mounted) return;
        const data = res.data?.rows || [];
        setRows(data);
        setLoading(false);
      })
      .catch(err => {
        setMessage('Erro ao carregar tabela NBS');
        setLoading(false);
        console.error(err);
      });
    return () => { mounted = false };
  }, []);

  function locateByItem() {
    setMessage(null);
    if (!query) return setMessage('Informe um valor para localizar');
    const normalize = (s) => {
      const str = String(s || '');
      // remove accents, then remove dots, commas, semicolons and colons, normalize whitespace and lowercase
      return str
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[.,;:]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();
    };

    const getFieldValue = (r, f) => {
      if (!r) return '';
      if (f === 'item_lc_116') return r.item_lc_116;
      if (f === 'descricao_item') return r.descricao_item || r['descricao item'] || r['descricao do item'] || '';
      if (f === 'nbs') return r.nbs;
      if (f === 'descricao_nbs') return r.descricao_nbs || r['descricao nbs'] || r['descricao do nbs'] || '';
      return r[f] || '';
    };

    // build list of all matching row indices (global indices)
    const qnorm = normalize(query);
    const foundIndices = [];
    rows.forEach((r, idx) => {
      const val = normalize(getFieldValue(r, field));
      if (!val) return;
      if (val.includes(qnorm)) foundIndices.push(idx);
    });

    if (!foundIndices.length) {
      setMatches([]);
      setCurrentMatchIdx(-1);
      setMessage('Nenhuma ocorrência encontrada');
      return;
    }

    setMatches(foundIndices);
    // go to first match
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
        <h2>Tabela NBS</h2>
        <p>Localizar por item LC 116: informe o código do item e o sistema levará você até a linha correspondente.</p>
        <SearchRow>
          <select value={field} onChange={(e) => setField(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#0f0f0f', color: '#eee' }}>
            <option value="item_lc_116">Item LC 116</option>
            <option value="descricao_item">Descrição Item</option>
            <option value="nbs">NBS</option>
            <option value="descricao_nbs">Descrição NBS</option>
          </select>
          <Input placeholder={field === 'item_lc_116' ? 'Item LC 116 (ex: 1)' : field === 'descricao_item' ? 'Descrição do Item' : field === 'nbs' ? 'NBS (ex: 59020010)' : 'Descrição NBS'} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') locateByItem(); }} />
          <Button onClick={locateByItem}>Localizar</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button onClick={() => goToMatch(-1)} disabled={!matches.length}>◀</Button>
            <div style={{ color: '#a8892a', minWidth: 80, textAlign: 'center' }}>{matches.length ? `${(currentMatchIdx >= 0 ? currentMatchIdx + 1 : 0)} / ${matches.length}` : '0 / 0'}</div>
            <Button onClick={() => goToMatch(1)} disabled={!matches.length}>▶</Button>
          </div>
          <Button onClick={() => { setWindowStart(0); setQuery(''); setMatches([]); setCurrentMatchIdx(-1); setMessage(null); }}>Voltar ao topo</Button>
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
                    <Th>Item LC 116</Th>
                    <Th>Descrição Item</Th>
                    <Th>NBS</Th>
                    <Th>Descrição NBS</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => {
                    const globalIndex = windowStart + i;
                    const normalize = (s) => {
                      const str = String(s || '');
                      return str
                        .normalize('NFD')
                        .replace(/\p{Diacritic}/gu, '')
                        .replace(/[.,;:]/g, '')
                        .replace(/\s+/g, ' ')
                        .toLowerCase()
                        .trim();
                    };
                    const getFieldValue = (row, f) => {
                      if (!row) return '';
                      if (f === 'item_lc_116') return row.item_lc_116;
                      if (f === 'descricao_item') return row.descricao_item || row['descricao item'] || row['descricao do item'] || '';
                      if (f === 'nbs') return row.nbs;
                      if (f === 'descricao_nbs') return row.descricao_nbs || row['descricao nbs'] || row['descricao do nbs'] || '';
                      return row[f] || '';
                    };

                    const fieldVal = String(getFieldValue(r, field) || '');
                    const isTarget = matches.length && matches[currentMatchIdx] === globalIndex;
                    const RowTag = isTarget ? Highlight : 'tr';
                    return (
                      <RowTag key={globalIndex} ref={isTarget ? targetRef : null}>
                        <Td>{r.item_lc_116}</Td>
                        <Td style={{ paddingLeft: '24px' }}>{r.descricao_item || r['descricao item'] || ''}</Td>
                        <Td>{r.nbs}</Td>
                        <Td style={{ paddingLeft: '24px' }}>{r.descricao_nbs || r['descricao nbs'] || ''}</Td>
                      </RowTag>
                    );
                  })}
                </tbody>
              </Table>
            </div>

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
