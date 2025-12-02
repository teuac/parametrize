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
  border-collapse: separate; /* allow rounded corners */
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #a8892a; /* match system yellow */
  font-size: 0.95rem;
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
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const Highlight = styled.tr`
  background: ${p => `rgba(168,137,42,${p.intensity})`} ;
  box-shadow: ${p => `inset 6px 0 0 0 rgba(168,137,42,${Math.min(0.95, p.intensity + 0.12)})`} ;
  transition: background 160ms ease, box-shadow 160ms ease;
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

export default function TabelaCfops() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [field, setField] = useState('cfop');
  const [matches, setMatches] = useState([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [highlightIntensity, setHighlightIntensity] = useState(0.22);
  const [windowStart, setWindowStart] = useState(0);
  const pageSize = 21;
  const tableRef = useRef(null);
  const targetRef = useRef(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/util/tabela-cfops')
      .then(res => {
        if (!mounted) return;
        const data = res.data?.rows || [];
        setRows(data);
        setLoading(false);
      })
      .catch(err => {
        setMessage('Erro ao carregar tabela CFOPS');
        setLoading(false);
        console.error(err);
      });
    return () => { mounted = false };
  }, []);

  function locateByCodigo() {
    setMessage(null);
    if (!query) return setMessage('Informe um código para localizar');
    // normalize helpers
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
    const normalizeDigits = (s) => String(s || '').replace(/\D/g, '').trim();

    const getFieldValue = (row) => {
      const { grupo, cfop, desc, aplic } = detectRow(row);
      if (field === 'grupo') return grupo;
      if (field === 'cfop') return cfop;
      if (field === 'aplic') return aplic;
      return desc;
    };

    const qnorm = field === 'cfop' ? normalizeDigits(query) : normalizeText(query);
    // if CFOP search but query contains no digits, avoid matching every row (empty qnorm matches all)
    if (field === 'cfop' && !qnorm) {
      setMatches([]);
      setCurrentMatchIdx(-1);
      return setMessage('Informe um código CFOP numérico para localizar');
    }
    const foundIndices = [];
    rows.forEach((r, idx) => {
      const val = getFieldValue(r);
      const vnorm = field === 'cfop' ? normalizeDigits(val) : normalizeText(val);
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

  const pick = (row, candidates) => {
    for (const k of candidates) {
      if (row == null) break;
      if (Object.prototype.hasOwnProperty.call(row, k) && row[k] !== null && row[k] !== undefined && String(row[k]) !== '') return row[k];
    }
    return '';
  };

  const detectRow = (row) => {
    if (!row) return { grupo: '', cfop: '', desc: '' };
    const entries = Object.entries(row);
    const normKey = (k) => String(k || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    let cfop = '';
    let grupo = '';
    let desc = '';
    let aplic = '';

    // prefer explicit header names
    for (const [k, v] of entries) {
      const nk = normKey(k);
      // map 'grupo' first to avoid matching 'cfop' inside 'grupo_cfop'
      if (!grupo && nk.includes('grupo')) grupo = v;
      // exact matches for CFOP or code
      if (!cfop && (nk === 'cfop' || nk === 'codigo' || nk === 'cod' || nk === 'ncm')) cfop = v;
      // description
      if (!desc && nk.includes('descr')) desc = v;
      // application / aplicação
      if (!aplic && (nk.includes('aplic') || nk.includes('aplica') || nk.includes('uso') || nk.includes('aplica\u00e7') )) aplic = v;
      // if still not found, a key that contains 'cfop' but is not 'grupo' could be CFOP
      if (!cfop && nk.includes('cfop')) cfop = v;
    }

    // fallback: cfop as a numeric-looking cell
    if (!cfop) {
      const maybe = entries.find(([k, v]) => v !== null && v !== undefined && String(v).replace(/\D/g, '').length > 0 && String(v).replace(/\D/g, '').length <= 6);
      if (maybe) cfop = maybe[1];
    }
    // if backend produced generic column keys like col_0, col_1, col_2 use positional mapping
    const colKeys = entries.map(([k]) => k).filter(k => /^col_\d+$/.test(String(k)));
    if (colKeys.length >= 3) {
      // sort by index
      colKeys.sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]));
      const c0 = row[colKeys[0]]; // grupo
      const c1 = row[colKeys[1]]; // cfop
      const c2 = row[colKeys[2]]; // descricao
      const c3 = colKeys.length >= 4 ? row[colKeys[3]] : undefined; // aplicacao
      grupo = grupo || c0 || '';
      cfop = cfop || c1 || '';
      desc = desc || c2 || '';
      aplic = aplic || c3 || '';
    }

    // fallback: description = first non-empty cell that is not CFOP or Grupo
    if (!desc) {
      for (const [k, v] of entries) {
        const s = String(v || '');
        if (!s) continue;
        // skip if looks like cfop (mostly digits) or equals grupo
        const sDigits = s.replace(/\D/g, '');
        if (s === cfop || s === grupo) continue;
        if (sDigits.length > 0 && sDigits.length <= 6 && sDigits === s.trim()) continue;
        desc = s;
        break;
      }
    }

    // fallback: grupo = first non-empty cell that's likely a group (long text but not description)
    if (!grupo) {
      for (const [k, v] of entries) {
        const s = String(v || '');
        if (!s) continue;
        if (s === desc || s === cfop) continue;
        // prefer strings longer than 20 chars (group labels tend to be long)
        if (s.length >= 10) { grupo = s; break; }
      }
    }

    // final sanitization
    grupo = grupo || '';
    cfop = cfop || '';
    desc = desc || '';
    // Use explicit keys from the backend, with a few safe fallbacks
    const tryKeys = (obj, keys) => {
      for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== null && obj[k] !== undefined && String(obj[k]) !== '') return obj[k];
      }
      return '';
    };

    grupo = tryKeys(row, ['grupo_cfop', 'GRUPO_CFOP', 'grupo cfop', 'grupo', 'grupo_cfop_']);
    cfop = tryKeys(row, ['codigo', 'cod_cfop', 'COD_CFOP', 'cfop', 'cod', 'col_1', 'col_0']);
    desc = tryKeys(row, ['descricao', 'DESCRIÇÃO_CFOP', 'DESCRICAO_CFOP', 'descricao_cfop', 'descricao', 'descricao_completa']);
    aplic = tryKeys(row, ['aplicacao', 'APLICACAO', 'APLICAÇÃO', 'APLICACAO_CFOP', 'APLICACAO CFOP', 'uso', 'observacao', 'OBSERVACAO']);
    return { grupo, cfop, desc, aplic };
  };

  return (
    <Layout>
      <Sidebar />
      <Content>
        <h2>Tabela CFOPS</h2>
        <p>Localizar por código: informe o código CFOP e o sistema levará você até a linha correspondente mostrando linhas antes e depois.</p>
        <SearchRow>
          <select value={field} onChange={(e) => setField(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#0f0f0f', color: '#eee' }}>
            <option value="cfop">COD_CFOP</option>
            <option value="desc">DESCRIÇÃO_CFOP</option>
            <option value="aplic">APLICAÇÃO</option>
          </select>
          <Input placeholder={field === 'cfop' ? 'CFOP (ex: 1101)' : field === 'aplic' ? 'Aplicação / Uso' : 'Descrição CFOP'} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') locateByCodigo(); }} />
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
                    <Th>COD_CFOP</Th>
                    <Th>DESCRIÇÃO_CFOP</Th>
                    <Th>APLICAÇÃO</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => {
                    const globalIndex = windowStart + i;
                    const { grupo, cfop, desc, aplic } = detectRow(r);
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
                    const normalizeDigits = (s) => String(s || '').replace(/\D/g, '').trim();

                    const v = field === 'cfop' ? normalizeDigits(cfop) : field === 'grupo' ? normalizeText(grupo) : normalizeText(desc);
                    const isTarget = matches.length && matches[currentMatchIdx] === globalIndex;
                    if (isTarget) {
                      return (
                        <Highlight key={globalIndex} intensity={highlightIntensity} ref={targetRef}>
                          <Td>{cfop}</Td>
                          <Td>{desc}</Td>
                          <Td>{aplic}</Td>
                        </Highlight>
                      );
                    }
                    return (
                      <tr key={globalIndex}>
                        <Td>{cfop}</Td>
                        <Td>{desc}</Td>
                        <Td>{aplic}</Td>
                      </tr>
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
