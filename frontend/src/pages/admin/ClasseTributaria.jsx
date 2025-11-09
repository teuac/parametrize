import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../api/http';
import { Edit2, Trash2, PlusCircle } from 'lucide-react';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display:flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Controls = styled.div`
  display:flex;
  gap:12px;
  align-items:center;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
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
  border:1px solid #ccc;
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
  width: 100%;
  border-collapse: collapse;
  color: ${({ theme }) => theme.colors.text};
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Td = styled.td`
  padding: 10px 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
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

const Title = styled.h2`
  margin:0;
  color: ${({ theme }) => theme.colors.text};
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

const ModalOverlay = styled.div`
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
`;

const ModalBox = styled.div`
  width: 640px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  padding: 18px;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.3);
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
`;

const CancelBtn = styled.button`
  padding:8px 12px;
  border-radius:6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
`;

const ModalActions = styled.div`
  display:flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

export default function ClasseTributaria(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ codigoClassTrib: '', cstIbsCbs: '', descricaoCstIbsCbs: '', descricaoClassTrib: '', lcRedacao: '', lc214_25: '', pRedIBS: '', pRedCBS: '', link: '' });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { load(); }, []);

  async function load(){
    setLoading(true);
    try{
      const res = await api.get('/class-trib');
      setRows(res.data || []);
    }catch(err){ console.error(err) }
    finally{ setLoading(false) }
  }

  function setField(k, v){ setForm(prev => ({ ...prev, [k]: v })) }

  async function save(){
    try{
      const payload = { ...form };
      payload.codigoClassTrib = Number(payload.codigoClassTrib) || undefined;
      if (editingId){
        await api.put(`/class-trib/${editingId}`, payload);
      } else {
        await api.post('/class-trib', payload);
      }
      setForm({ codigoClassTrib: '', cstIbsCbs: '', descricaoCstIbsCbs: '', descricaoClassTrib: '', lcRedacao: '', lc214_25: '', pRedIBS: '', pRedCBS: '', link: '' });
      setEditingId(null);
      setModalOpen(false);
      await load();
    }catch(err){ console.error(err); alert('Erro ao salvar') }
  }

  function edit(row){
    setEditingId(row.id);
    setForm({
      codigoClassTrib: String(row.codigoClassTrib || ''),
      cstIbsCbs: row.cstIbsCbs || '',
      descricaoCstIbsCbs: row.descricaoCstIbsCbs || '',
      descricaoClassTrib: row.descricaoClassTrib || '',
      lcRedacao: row.lcRedacao || '',
      lc214_25: row.lc214_25 || '',
      pRedIBS: row.pRedIBS || '',
      pRedCBS: row.pRedCBS || '',
      link: row.link || ''
    });
    setModalOpen(true);
  }

  async function remove(id){
    if (!confirm('Confirma exclusão?')) return;
    try{ await api.delete(`/class-trib/${id}`); await load(); }catch(err){ console.error(err); alert('Erro ao excluir') }
  }

  return (
    <Container>
      <Header>
        <Title>Classe Tributária</Title>
        <Controls>
          <div />
          <NewBtn onClick={() => { setEditingId(null); setForm({ codigoClassTrib: '', cstIbsCbs: '', descricaoCstIbsCbs: '', descricaoClassTrib: '', lcRedacao: '', lc214_25: '', pRedIBS: '', pRedCBS: '', link: '' }); setModalOpen(true); }}><PlusCircle size={16} /> Nova Classe</NewBtn>
        </Controls>
      </Header>

      <Card>
        {/* Modal will handle create/edit now */}
        
        {modalOpen && (
          <ModalOverlay onClick={() => setModalOpen(false)}>
            <ModalBox onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{editingId ? 'Editar Classe Tributária' : 'Nova Classe Tributária'}</h3>
              <div>
                <Field>
                  <Label>CST</Label>
                  <Input value={form.cstIbsCbs} onChange={e => setField('cstIbsCbs', e.target.value)} />
                </Field>
                <Field>
                  <Label>Código</Label>
                  <Input value={form.codigoClassTrib} onChange={e => setField('codigoClassTrib', e.target.value)} />
                </Field>
                <Field>
                  <Label>Descrição</Label>
                  <Input value={form.descricaoClassTrib} onChange={e => setField('descricaoClassTrib', e.target.value)} />
                </Field>
                <Field>
                  <Label>descr. cstIbsCbs</Label>
                  <Input value={form.descricaoCstIbsCbs} onChange={e => setField('descricaoCstIbsCbs', e.target.value)} />
                </Field>
                <Field>
                  <Label>% Red CBS</Label>
                  <Input value={form.pRedCBS} onChange={e => setField('pRedCBS', e.target.value)} />
                </Field>
                <Field>
                  <Label>LC Redação</Label>
                  <Input value={form.lcRedacao} onChange={e => setField('lcRedacao', e.target.value)} />
                </Field>
                <Field>
                  <Label>LC 214/25</Label>
                  <Input value={form.lc214_25} onChange={e => setField('lc214_25', e.target.value)} />
                </Field>
                <Field>
                  <Label>Link</Label>
                  <Input value={form.link} onChange={e => setField('link', e.target.value)} />
                </Field>
              </div>
              <ModalActions>
                <CancelBtn onClick={() => { setModalOpen(false); setEditingId(null); setForm({ codigoClassTrib: '', cstIbsCbs: '', descricaoCstIbsCbs: '', descricaoClassTrib: '', lcRedacao: '', lc214_25: '', pRedIBS: '', pRedCBS: '', link: '' }) }}>Cancelar</CancelBtn>
                <Button onClick={save}>{editingId ? 'Atualizar' : 'Criar'}</Button>
              </ModalActions>
            </ModalBox>
          </ModalOverlay>
        )}

        {loading ? <div>Carregando...</div> : (
          <Table>
            <thead>
                  <tr>
                    <Th>CST</Th>
                    <Th>Codigo</Th>
                    <Th>Descrição</Th>
                    <Th style={{ width: 140 }}></Th>
                  </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <Td>{r.cstIbsCbs}</Td>
                  <Td>{r.codigoClassTrib}</Td>
                  <Td>{r.descricaoClassTrib}</Td>
                  <Td>
                    <Actions>
                      <IconBtn title="Editar" onClick={() => edit(r)}><Edit2 size={16} /></IconBtn>
                      <IconBtn title="Excluir" onClick={() => remove(r.id)}><Trash2 size={16} /></IconBtn>
                    </Actions>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}
