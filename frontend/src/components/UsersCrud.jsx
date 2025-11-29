import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display:flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
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
  background: ${({ theme }) => theme.colors.surface};
  padding: 20px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
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

const Input = styled.input`
  padding:10px 12px;
  border-radius:8px;
  border:1px solid ${({ theme }) => theme.colors.border};
  background:${({ theme }) => theme.colors.surface};
  color:${({ theme }) => theme.colors.text};
`;

const Select = styled.select`
  padding:10px 12px;
  border-radius:8px;
  border:1px solid ${({ theme }) => theme.colors.border};
  background:${({ theme }) => theme.colors.surface};
  color:${({ theme }) => theme.colors.text};
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

export default function UsersCrud(){
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('email');
  const [statusFilter, setStatusFilter] = useState('all');
  const [usageMap, setUsageMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'user', active: true, isBlocked: false, cpfCnpj: '', telefone: '', adesao: null, activeUpdatedAt: null, dailySearchLimit: 100, quotaType: 'DAILY', packageLimit: 0, packageRemaining: 0 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try{
      const { data } = await api.get('/users');
      setUsers(data);
      try {
        const resp = await api.get('/util/search-usage');
        setUsageMap(resp.data?.usage || {});
      } catch (e) {
        console.warn('Não foi possível obter uso de buscas por usuário', e);
        setUsageMap({});
      }
    }catch(e){ console.error(e) }
    setLoading(false);
  };

  useEffect(()=>{ fetchUsers() }, []);

  const openNew = () => { setEditing(null); setForm({ name:'', email:'', password:'', role:'user', active: true, isBlocked: false, cpfCnpj: '', telefone: '', dailySearchLimit: 100, quotaType: 'DAILY', packageLimit: 0, packageRemaining: 0 }); setModalOpen(true) };
  const openEdit = (u) => { setEditing(u); setForm({ name:u.name, email:u.email, password:'', role:u.role, active: u.active ?? true, isBlocked: u.isBlocked ?? u.blocked ?? false, cpfCnpj: u.cpfCnpj ?? '', telefone: u.telefone ?? '', adesao: u.adesao, activeUpdatedAt: u.activeUpdatedAt, dailySearchLimit: u.dailySearchLimit ?? 100, quotaType: u.quotaType || 'DAILY', packageLimit: u.packageLimit || 0, packageRemaining: u.packageRemaining || 0 }); setModalOpen(true) };

  const save = async () => {
    try{
      const payloadBase = { name: form.name, email: form.email, ...(form.password?{password:form.password}:{}), role: form.role, active: form.active, isBlocked: Boolean(form.isBlocked), cpfCnpj: form.cpfCnpj, telefone: form.telefone, dailySearchLimit: Number(form.dailySearchLimit || 0), quotaType: form.quotaType || 'DAILY' };
      if (form.quotaType === 'PACKAGE') {
        payloadBase.packageLimit = Number(form.packageLimit || 0);
        payloadBase.packageRemaining = Number(form.packageRemaining || form.packageLimit || 0);
      }

      if(editing){
        await api.put(`/users/${editing.id}`, payloadBase);
      }else{
        await api.post('/users', payloadBase);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title>Gestão de Usuários</Title>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SearchWrapper>
              <Select value={searchField} onChange={e=>setSearchField(e.target.value)} style={{ height: 38 }}>
                <option value="name">Nome</option>
                <option value="email">E-mail</option>
                <option value="cpf">CPF/CNPJ</option>
              </Select>
              <SearchInput placeholder={searchField === 'email' ? 'Pesquisar por e-mail' : searchField === 'name' ? 'Pesquisar por nome' : 'Pesquisar por CPF/CNPJ'} value={search} onChange={e=>setSearch(e.target.value)} />
            </SearchWrapper>
            <NewBtn onClick={openNew}><PlusCircle size={16} /> Novo usuário</NewBtn>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: 'var(--text, #666)', fontSize: '0.95rem' }}>Exibindo:</div>
            <Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ height: 38 }}>
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
            </Select>
          </div>
        </div>
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
                <Th>Tipo cota / Limite</Th>
                <Th>Buscas restantes</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Adesão</Th>
                <Th>Últ. alteração status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => {
                  // Status filter
                  const isBlocked = Boolean(u.isBlocked ?? u.blocked);
                  if (statusFilter === 'active' && !(u.active && !isBlocked)) return false;
                  if (statusFilter === 'inactive' && !( !u.active && !isBlocked)) return false;
                  if (statusFilter === 'blocked' && !isBlocked) return false;

                  // Search filter
                  if (!search) return true;
                  const q = String(search).toLowerCase();
                  if (searchField === 'name') return (u.name || '').toLowerCase().includes(q);
                  if (searchField === 'cpf') return (u.cpfCnpj || '').toLowerCase().includes(q);
                  return (u.email || '').toLowerCase().includes(q);
                })
                .map(u=> (
                <tr key={u.id}>
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.cpfCnpj || '-'}</Td>
                  <Td>{u.telefone || '-'}</Td>
                  <Td>{u.quotaType === 'PACKAGE' ? `Pacote ${u.packageLimit || 0}` : (typeof u.dailySearchLimit !== 'undefined' ? `Diário ${u.dailySearchLimit}` : '-')}</Td>
                  <Td>{(() => {
                    if (u.quotaType === 'PACKAGE') {
                      return String(Number(u.packageRemaining || 0));
                    }
                    const limit = Number(u.dailySearchLimit ?? 0);
                    const used = Number(usageMap[String(u.id)] || 0);
                    const remaining = limit - used;
                    return Number.isFinite(remaining) ? String(remaining) : '-';
                  })()}</Td>
                  <Td>{u.role}</Td>
                  <Td>{(u.isBlocked ?? u.blocked) ? 'Bloqueado' : (u.active ? 'Ativo' : 'Inativo')}</Td>
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
                  <Td colSpan={11} style={{ padding: 18, textAlign: 'center', color: '#888' }}>Nenhum usuário encontrado</Td>
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
              <label>Tipo de cota</label>
              <Select value={form.quotaType || 'DAILY'} onChange={e => setForm({ ...form, quotaType: e.target.value })}>
                <option value="DAILY">Diária</option>
                <option value="PACKAGE">Pacote</option>
              </Select>
            </Field>
            {form.quotaType === 'DAILY' && (
              <Field>
                <label>Limite de buscas diárias</label>
                <Input type="number" min={0} value={form.dailySearchLimit ?? 0} onChange={e=>setForm({...form, dailySearchLimit: Number(e.target.value || 0)})} />
              </Field>
            )}
            {form.quotaType === 'PACKAGE' && (
              <>
                <Field>
                  <label>Tamanho do pacote (limite)</label>
                  <Input type="number" min={0} value={form.packageLimit ?? 0} onChange={e => {
                    const v = Number(e.target.value || 0);
                    // when creating a new user (not editing), keep packageRemaining in sync with packageLimit
                    if (!editing) setForm({ ...form, packageLimit: v, packageRemaining: v });
                    else setForm({ ...form, packageLimit: v });
                  }} />
                </Field>
                <Field>
                  <label>Consultas restantes no pacote</label>
                  <Input type="number" min={0} value={form.packageRemaining ?? 0} onChange={e => setForm({ ...form, packageRemaining: Number(e.target.value || 0) })} />
                </Field>
              </>
            )}
            <Field>
              <label>Status</label>
              <Select
                value={form.isBlocked ? 'blocked' : (form.active ? 'active' : 'inactive')}
                onChange={e => {
                  const v = e.target.value;
                  if (v === 'active') setForm({ ...form, active: true, isBlocked: false });
                  else if (v === 'inactive') setForm({ ...form, active: false, isBlocked: false });
                  else if (v === 'blocked') setForm({ ...form, active: false, isBlocked: true });
                }}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="blocked">Bloqueado</option>
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
