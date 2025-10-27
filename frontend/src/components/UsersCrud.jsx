import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';

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
  background: #080808;
  border: 1px solid #1f1f1f;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
`;

const SearchWrapper = styled.div`
  display:flex;
  align-items:center;
  gap:8px;
`;

const SearchInput = styled.input`
  padding:8px 10px;
  border-radius:8px;
  border:1px solid #333;
  background:#0f0f0f;
  color:#fff;
  min-width:220px;
  height:38px;
  box-sizing: border-box;
`;

const Title = styled.h2`
  margin:0;
  color: #fff;
`;

const NewBtn = styled.button`
  background: #a8892a;
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: #eee;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: #bbb;
`;

const Td = styled.td`
  padding: 10px 12px;
  border-top: 1px solid #222;
`;

const Actions = styled.div`
  display:flex;
  gap:8px;
`;

const IconBtn = styled.button`
  background: transparent;
  border: none;
  color: #ddd;
  padding:6px;
  border-radius:6px;
  cursor:pointer;
  &:hover{ background: rgba(255,255,255,0.03); color:#fff }
`;

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
  background: #0b0b0b;
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  max-width: 520px;
  border:1px solid #222;
`;

const Field = styled.div`
  display:flex;
  flex-direction:column;
  gap:6px;
  margin-bottom:12px;
`;

const Input = styled.input`
  padding:10px 12px;
  border-radius:8px;
  border:1px solid #333;
  background:#111;
  color:#fff;
`;

const Select = styled.select`
  padding:10px 12px;
  border-radius:8px;
  border:1px solid #333;
  background:#111;
  color:#fff;
`;

const ModalActions = styled.div`
  display:flex;
  gap:8px;
  justify-content:flex-end;
`;

const SaveBtn = styled.button`
  background:#a8892a; color:#0b0b0b; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;
`;

const CancelBtn = styled.button`
  background:transparent; color:#ddd; border:1px solid #333; padding:8px 12px; border-radius:8px; cursor:pointer;
`;

export default function UsersCrud(){
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'user', active: true, cpfCnpj: '', telefone: '', adesao: null, activeUpdatedAt: null, dailySearchLimit: 100 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try{
      const { data } = await api.get('/users');
      setUsers(data);
    }catch(e){ console.error(e) }
    setLoading(false);
  };

  useEffect(()=>{ fetchUsers() }, []);

  const openNew = () => { setEditing(null); setForm({ name:'', email:'', password:'', role:'user', active: true, cpfCnpj: '', telefone: '', dailySearchLimit: 100 }); setModalOpen(true) };
  const openEdit = (u) => { setEditing(u); setForm({ name:u.name, email:u.email, password:'', role:u.role, active: u.active ?? true, cpfCnpj: u.cpfCnpj ?? '', telefone: u.telefone ?? '', adesao: u.adesao, activeUpdatedAt: u.activeUpdatedAt, dailySearchLimit: u.dailySearchLimit ?? 100 }); setModalOpen(true) };

  const save = async () => {
    try{
      if(editing){
        await api.put(`/users/${editing.id}`, { name: form.name, email: form.email, ...(form.password?{password:form.password}:{}), role: form.role, active: form.active, cpfCnpj: form.cpfCnpj, telefone: form.telefone, dailySearchLimit: Number(form.dailySearchLimit || 0) });
      }else{
        await api.post('/users', { ...form, dailySearchLimit: Number(form.dailySearchLimit || 0) });
      }
      setModalOpen(false);
      fetchUsers();
    }catch(e){ console.error(e); alert('Erro ao salvar usuário'); }
  };

  const openDelete = (u) => { setDeleteTarget(u); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if(!deleteTarget) return;
    try{
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchUsers();
    }catch(e){ console.error(e); alert('Erro ao apagar'); }
  };

  return (
    <Container>
      <Header>
        <Title>Gestão de Usuários</Title>
        <Controls>
          <SearchWrapper>
            <SearchInput placeholder="Pesquisar por e-mail" value={search} onChange={e=>setSearch(e.target.value)} />
          </SearchWrapper>
          <NewBtn onClick={openNew}><PlusCircle size={16} /> Novo usuário</NewBtn>
        </Controls>
      </Header>

      <Card>
        {loading ? <div>Carregando...</div> : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>E-mail</Th>
                <Th>CPF/CNPJ</Th>
                <Th>Telefone</Th>
                  <Th>Limite buscas/dia</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                <Th>Adesão</Th>
                <Th>Últ. alteração status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => !search || (u.email || '').toLowerCase().includes(search.toLowerCase()))
                .map(u=> (
                <tr key={u.id}>
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.cpfCnpj || '-'}</Td>
                  <Td>{u.telefone || '-'}</Td>
                  <Td>{typeof u.dailySearchLimit !== 'undefined' ? u.dailySearchLimit : '-'}</Td>
                  <Td>{u.role}</Td>
                  <Td>{u.active ? 'Ativo' : 'Inativo'}</Td>
                  <Td>{u.adesao ? new Date(u.adesao).toLocaleString() : new Date(u.createdAt).toLocaleString()}</Td>
                  <Td>{u.activeUpdatedAt ? new Date(u.activeUpdatedAt).toLocaleString() : '-'}</Td>
                  <Td>
                    <Actions>
                        <IconBtn title="Editar" onClick={()=>openEdit(u)}><Edit2 size={16} /></IconBtn>
                        <IconBtn title="Apagar" onClick={()=>openDelete(u)}><Trash2 size={16} /></IconBtn>
                    </Actions>
                  </Td>
                </tr>
              ))}
              {users.filter(u => !search || (u.email || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <tr>
                  <Td colSpan={9} style={{ padding: 18, textAlign: 'center', color: '#888' }}>Nenhum usuário encontrado</Td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {modalOpen && (
        <ModalOverlay>
          <ModalBox>
            <h3>{editing? 'Editar usuário':'Novo usuário'}</h3>
            <Field>
              <label>Nome</label>
              <Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            </Field>
            <Field>
              <label>E-mail</label>
              <Input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            </Field>
            <Field>
              <label>Senha {editing? '(deixe em branco para manter)': ''}</label>
              <Input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
            </Field>
            <Field>
              <label>Role</label>
              <Select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Field>
              <label>CPF/CNPJ</label>
              <Input value={form.cpfCnpj || ''} onChange={e=>setForm({...form, cpfCnpj: e.target.value})} />
            </Field>
            <Field>
              <label>Telefone</label>
              <Input value={form.telefone || ''} onChange={e=>setForm({...form, telefone: e.target.value})} />
            </Field>
            <Field>
              <label>Limite de buscas diárias</label>
              <Input type="number" min={0} value={form.dailySearchLimit ?? 0} onChange={e=>setForm({...form, dailySearchLimit: e.target.value})} />
            </Field>
            <Field>
              <label>Status</label>
              <Select value={form.active ? 'active' : 'inactive'} onChange={e=>setForm({...form, active: e.target.value === 'active'})}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </Select>
            </Field>
            {editing && (
              <>
                <Field>
                  <label>Adesão</label>
                  <Input value={form.adesao ? new Date(form.adesao).toLocaleString() : ''} readOnly />
                </Field>
                <Field>
                  <label>Última alteração status</label>
                  <Input value={form.activeUpdatedAt ? new Date(form.activeUpdatedAt).toLocaleString() : ''} readOnly />
                </Field>
              </>
            )}

            <ModalActions>
              <CancelBtn onClick={()=>setModalOpen(false)}>Cancelar</CancelBtn>
              <SaveBtn onClick={save}>{editing? 'Salvar':'Criar'}</SaveBtn>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}

      {deleteModalOpen && (
        <ModalOverlay style={{ zIndex: 10000 }}>
          <ModalBox>
            <h3>Confirmar exclusão</h3>
            <p>Tem certeza que deseja apagar o usuário <strong>{deleteTarget?.email}</strong>? Esta ação não pode ser desfeita.</p>
            <ModalActions>
              <CancelBtn onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}>Cancelar</CancelBtn>
              <SaveBtn onClick={confirmDelete} style={{ background: '#c0392b' }}>Apagar</SaveBtn>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
  );
}
