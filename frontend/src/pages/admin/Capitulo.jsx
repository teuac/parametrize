import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../../api/http'
import { Edit2, Trash2, Plus } from 'lucide-react'

const Container = styled.div`
  padding: 16px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  margin-bottom: 16px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const SearchInput = styled.input`
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  width: 260px;
`

const NewBtn = styled.button`
  background: ${({ theme }) => theme.colors.accent};
  color: #0b0b0b;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
`

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  text-align: left;
  padding: 8px 6px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
`

const Td = styled.td`
  padding: 10px 6px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
`

const IconBtn = styled.button`
  border: none;
  background: transparent;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text};
  &:hover { background: ${({ theme }) => theme.colors.hover}; }
`

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  max-width: 520px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
`

const Label = styled.label`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
`

const TextInput = styled.input`
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`

const ModalActions = styled.div`
  display:flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`

const SaveBtn = styled.button`
  background: ${({ theme }) => theme.colors.accent};
  color: #0b0b0b;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
`

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
`
;

export default function Capitulo() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ chapter_code: '', description: '' })

  useEffect(() => { fetchRows() }, [])

  async function fetchRows() {
    setLoading(true)
    try {
      const res = await api.get('/chapter')
      setRows(res.data || [])
    } catch (err) {
      console.error('Failed to fetch capítulos', err)
    } finally { setLoading(false) }
  }

  function openNew() {
    setEditing(null)
    setForm({ chapter_code: '', description: '' })
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ chapter_code: row.chapter_code || row.codigo || row.code || '', description: row.description || row.descricao || row.description || '' })
    setModalOpen(true)
  }

  async function save() {
    try {
      if (!form.chapter_code) return alert('Código é obrigatório')
      const payload = { chapter_code: form.chapter_code, description: form.description }
      if (editing && editing.id) {
        await api.put(`/chapter/${editing.id}`, payload)
      } else {
        await api.post('/chapter', payload)
      }
      setModalOpen(false)
      fetchRows()
    } catch (err) {
      console.error('Failed to save capítulo', err)
      alert(err?.response?.data?.message || 'Erro ao salvar')
    }
  }

  async function remove(row) {
    if (!confirm('Tem certeza que deseja remover este Capítulo?')) return
    try {
      await api.delete(`/chapter/${row.id}`)
      fetchRows()
    } catch (err) {
      console.error('Failed to delete capítulo', err)
      alert(err?.response?.data?.message || 'Erro ao remover')
    }
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    const code = String(r.chapter_code || r.codigo || r.code || '')
    const desc = String(r.description || r.descricao || r.description || '')
    return code.toLowerCase().includes(s) || desc.toLowerCase().includes(s)
  })

  return (
    <Container>
      <Header>
        <Title>Gestão de Capítulo</Title>
        <Controls>
          <SearchInput placeholder="Buscar código ou descrição" value={search} onChange={e => setSearch(e.target.value)} />
          <NewBtn onClick={openNew}><Plus size={14}/> Novo Capítulo</NewBtn>
        </Controls>
      </Header>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th style={{width:120}}>Código</Th>
              <Th>Descrição</Th>
              <Th style={{width:120}}>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><Td colSpan={3}>Carregando...</Td></tr>
            ) : filtered.length === 0 ? (
              <tr><Td colSpan={3}>Nenhum capítulo encontrado</Td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <Td style={{fontWeight:600}}>{r.chapter_code || r.codigo || r.code}</Td>
                  <Td>{r.description || r.descricao || r.description}</Td>
                  <Td>
                    <Actions>
                      <IconBtn title="Editar" onClick={() => openEdit(r)}><Edit2 size={16} /></IconBtn>
                      <IconBtn title="Remover" onClick={() => remove(r)}><Trash2 size={16} /></IconBtn>
                    </Actions>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {modalOpen && (
        <ModalOverlay onClick={() => setModalOpen(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop:0}}>{editing ? 'Editar Capítulo' : 'Novo Capítulo'}</h3>
            <Field>
              <Label>Código</Label>
              <TextInput value={form.chapter_code} onChange={e => setForm({...form, chapter_code: e.target.value})} />
            </Field>
            <Field>
              <Label>Descrição</Label>
              <TextInput value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </Field>

            <ModalActions>
              <CancelBtn onClick={() => setModalOpen(false)}>Cancelar</CancelBtn>
              <SaveBtn onClick={save}>{editing ? 'Salvar' : 'Criar'}</SaveBtn>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
  )
}
