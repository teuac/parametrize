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
    if (!query) return setMessage('Informe um item para localizar');
    const normalize = (s) => String(s || '').toLowerCase().replace(/\./g, '').trim();
    const idx = rows.findIndex(r => normalize(r.item_lc_116) === normalize(query));
    const idx2 = rows.findIndex(r => normalize(r.item_lc_116).startsWith(normalize(query)));
    const found = idx >= 0 ? idx : idx2;
    if (found < 0) {
      setMessage('Item não encontrado');
      return;
    }
    const half = Math.floor(pageSize / 2);
    let start = Math.max(0, found - half);
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
          <Input placeholder="Item LC 116 (ex: 1)" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') locateByItem(); }} />
          <Button onClick={locateByItem}>Localizar</Button>
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
                    <Th>Item LC 116</Th>
                    <Th>Descrição Item</Th>
                    <Th>NBS</Th>
                    <Th>Descrição NBS</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => {
                    const globalIndex = windowStart + i;
                    const normalize = (s) => String(s || '').toLowerCase().replace(/\./g, '').trim();
                    const isTarget = query && normalize(String(r.item_lc_116)).startsWith(normalize(query));
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
