import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../api/http';
import { Edit2, Trash2, PlusCircle, X } from 'lucide-react';

const Container = styled.div`
  padding: 12px 0;
`;

const Row = styled.div`
  display:flex;
  gap:12px;
  margin-bottom:12px;
  align-items:flex-end;
`;

const Input = styled.input`
  padding:8px 10px;
  border-radius:6px;
  border:1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`;

const Button = styled.button`
  padding:8px 12px;
  border-radius:6px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight:600;
`;

const Table = styled.table`
  width:100%;
  border-collapse: collapse;
  margin-top:12px;
`;
const Th = styled.th`
  text-align:left;
  padding:8px;
  border-bottom:1px solid rgba(255,255,255,0.06);
`;
const Td = styled.td`
  padding:8px;
  border-bottom:1px solid rgba(255,255,255,0.03);
`;

// Additional styled components (match UsersCrud layout)
const Header = styled.div`
  display:flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  margin-bottom: 16px;
`;

const Controls = styled.div`
  display:flex;
  gap:12px;
  align-items:center;
  min-height: 38px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
`;

const SearchWrapper = styled.div`
  display:flex;
  align-items:center;
  gap:8px;
`;

const SearchInput = styled.input`
  padding:8px 10px;
  border-radius:8px;
  border:1px solid ${({ theme }) => theme.colors.border};
  background:${({ theme }) => theme.colors.surface};
  color:${({ theme }) => theme.colors.text};
  min-width:220px;
  height:38px;
  box-sizing: border-box;
`;

const Title = styled.h2`
  margin:0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.125rem;
  font-weight: 600;
`;

const NewBtn = styled.button`
  background: ${({ theme }) => theme.colors.accent};
  color: #0b0b0b;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  display:flex;
  gap:8px;
  align-items:center;
  cursor: pointer;
  height: 38px;
`;

const Actions = styled.div`
  display:flex;
  gap:8px;
`;

const IconBtn = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  padding:6px;
  border-radius:6px;
  cursor:pointer;
  &:hover{ background: rgba(0,0,0,0.03); color: ${({ theme }) => theme.colors.text} }
`;

export default function Ncm(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(''); // input bound value
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ codigo: '', descricao: '', cClasstrib: '' });
  const [classTribOptions, setClassTribOptions] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  useEffect(()=>{ fetchRows() }, []);

  async function fetchRows(){
    setLoading(true);
    try{
      // default fetch: get first page (backend returns first 50 when no query)
      const res = await api.get('/ncm');
      setRows(res.data || []);
    }catch(err){ console.error(err) }
    setLoading(false);
  }

  // load all (admin only on server side) - explicit action to avoid fetching everything by default
  async function loadAll(){
    setLoading(true);
    try{
      const res = await api.get('/ncm?all=1');
      setRows(res.data || []);
    }catch(err){ console.error(err) }
    setLoading(false);
  }

  // Debounced server-side search: when `search` changes, call backend with ?q=
  useEffect(() => {
    const t = setTimeout(() => {
      const q = (search || '').trim();
      (async () => {
        if (!q) {
          // empty search -> load default small set
          await fetchRows();
          return;
        }
        setLoading(true);
        try{
          const res = await api.get(`/ncm?q=${encodeURIComponent(q)}`);
          setRows(res.data || []);
        }catch(err){ console.error('Erro na busca server-side', err) }
        setLoading(false);
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ codigo: '', descricao: '', cClasstrib: '' });
    fetchClassTribOptions();
    setClassFilter('');
    setShowClassDropdown(false);
    setModalOpen(true);
  };

  function openEdit(row){
    setEditing(row.id);
    setForm({ codigo: row.codigo || '', descricao: row.descricao || '', cClasstrib: row.cClasstrib || '' });
    fetchClassTribOptions();
    setClassFilter('');
    setShowClassDropdown(false);
    setModalOpen(true);
  }

  async function remove(id){
    if(!confirm('Confirma exclusão desse NCM?')) return;
    try{ await api.delete(`/ncm/${id}`); fetchRows(); }catch(e){ console.error(e); alert('Erro ao excluir') }
  }

  async function fetchClassTribOptions(){
    try{
      const res = await api.get('/class-trib');
      setClassTribOptions(res.data || []);
    }catch(err){
      console.error('Erro ao carregar classes tributárias', err);
      setClassTribOptions([]);
    }
  }

  function setField(k, v){ setForm(prev => ({ ...prev, [k]: v })); }

  async function save(){
    try{
      const payload = { codigo: form.codigo, descricao: form.descricao, cClasstrib: Number(form.cClasstrib) };
      if (editing){
        await api.put(`/ncm/${editing}`, payload);
      } else {
        await api.post('/ncm', payload);
      }
      setModalOpen(false);
      setEditing(null);
      await fetchRows();
    }catch(err){ console.error('Erro ao salvar NCM', err); alert(err?.response?.data?.error || 'Erro ao salvar') }
  }

  function selectClass(option){
    setForm(prev => ({ ...prev, cClasstrib: option.codigoClassTrib }));
    setClassFilter(`${option.codigoClassTrib} - ${option.descricaoClassTrib || ''}`);
    setShowClassDropdown(false);
  }

  return (
    <Container>
      <Header>
        <Title>Gestão de NCM</Title>
        <Controls>
          <SearchWrapper>
              <SearchInput placeholder="Pesquisar por código ou descrição" value={search} onChange={e=>setSearch(e.target.value)} />
          </SearchWrapper>
            <NewBtn onClick={openNew}><PlusCircle size={16} /> Novo NCM</NewBtn>
            <Button style={{ marginLeft: 8, background: 'transparent', color: 'inherit', border: '1px solid rgba(0,0,0,0.06)' }} onClick={loadAll}>Carregar todos</Button>
        </Controls>
      </Header>

      <Card>
        {loading ? <div>Carregando...</div> : (
          <Table>
            <thead>
              <tr>
                <Th style={{ width: 180 }}>Código</Th>
                <Th>Descrição</Th>
                <Th style={{ width: 200 }}>cClasstrib</Th>
                <Th style={{ width: 90 }}></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <Td style={{ whiteSpace: 'nowrap' }}>{r.codigo}</Td>
                  <Td>{r.descricao}</Td>
                  <Td>{r.cClasstrib}</Td>
                  <Td>
                    <Actions>
                      <IconBtn title="Editar" onClick={()=>openEdit(r)}><Edit2 size={16} /></IconBtn>
                      <IconBtn title="Excluir" onClick={()=>remove(r.id)}><Trash2 size={16} /></IconBtn>
                    </Actions>
                  </Td>
                </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <Td colSpan={4} style={{ padding: 18, textAlign: 'center', color: '#888' }}>Nenhum NCM encontrado</Td>
                  </tr>
                )}
            </tbody>
          </Table>
        )}
      </Card>
      {modalOpen && (
        <ModalOverlay>
          <ModalBox>
            <CloseBtn title="Fechar" onClick={() => { setModalOpen(false); setEditing(null); }}><X size={16} /></CloseBtn>
            <h3>{editing ? 'Editar NCM' : 'Novo NCM'}</h3>
            <Field>
              <label>Código</label>
              <Input value={form.codigo} onChange={e => setField('codigo', e.target.value)} />
            </Field>
            <Field>
              <label>Descrição</label>
              <Input value={form.descricao} onChange={e => setField('descricao', e.target.value)} />
            </Field>
            <Field style={{ position: 'relative' }}>
              <label>cClasstrib</label>
              <Input
                value={classFilter || String(form.cClasstrib || '')}
                onChange={e => { setClassFilter(e.target.value); setShowClassDropdown(true); }}
                onFocus={() => { setShowClassDropdown(true); fetchClassTribOptions(); }}
                placeholder="Pesquisar código ou descrição"
              />
              {showClassDropdown && (
                <Dropdown>
                  {(classTribOptions || []).filter(opt => {
                    const txt = `${opt.codigoClassTrib} ${opt.descricaoClassTrib || ''}`.toLowerCase();
                    return !classFilter || txt.includes(classFilter.toLowerCase());
                  }).map(opt => (
                    <Option key={opt.id} onClick={() => selectClass(opt)}>
                      <strong>{opt.codigoClassTrib}</strong>
                      <div style={{ fontSize: 12, color: '#888' }}>{opt.descricaoClassTrib}</div>
                    </Option>
                  ))}
                  {(classTribOptions || []).filter(opt => {
                    const txt = `${opt.codigoClassTrib} ${opt.descricaoClassTrib || ''}`.toLowerCase();
                    return !classFilter || txt.includes(classFilter.toLowerCase());
                  }).length === 0 && <Option><em>Nenhum resultado</em></Option>}
                </Dropdown>
              )}
            </Field>

            <ModalActions>
              <CancelBtn onClick={() => { setModalOpen(false); setEditing(null); }}>Cancelar</CancelBtn>
              <SaveBtn onClick={save}>{editing ? 'Salvar' : 'Criar'}</SaveBtn>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
  );
}

// Modal styled components (match Users modal style)
const ModalOverlay = styled.div`
  position: fixed;
  inset:0;
  background: rgba(0,0,0,0.6);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 9999;
`;

const ModalBox = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  max-width: 520px;
  border:1px solid ${({ theme }) => theme.colors.border};
`;

const Field = styled.div`
  display:flex;
  flex-direction:column;
  gap:6px;
  margin-bottom:12px;
`;

const ModalActions = styled.div`
  display:flex;
  gap:8px;
  justify-content:flex-end;
`;

const SaveBtn = styled.button`
  background:${({ theme }) => theme.colors.accent}; color:#0b0b0b; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;
`;

const CancelBtn = styled.button`
  background:transparent; color:${({ theme }) => theme.colors.text}; border:1px solid ${({ theme }) => theme.colors.border}; padding:8px 12px; border-radius:8px; cursor:pointer;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow: auto;
  background: ${({ theme }) => theme.colors.surface};
  border:1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  margin-top:6px;
  z-index: 10001;
`;

const Option = styled.div`
  padding:8px;
  cursor:pointer;
  &:hover{ background: rgba(0,0,0,0.04) }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  &:hover{ background: rgba(0,0,0,0.04) }
`;
