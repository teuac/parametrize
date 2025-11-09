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
  margin-bottom: 12px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const SearchInput = styled.input`
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border, #ccc);
  width: 260px;
`

const NewBtn = styled.button`
  background: var(--primary, #2563eb);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
`

const Card = styled.div`
  background: var(--card, #fff);
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
  color: var(--muted, #666);
  font-size: 0.9rem;
`

const Td = styled.td`
  padding: 10px 6px;
  border-top: 1px solid rgba(0,0,0,0.04);
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
  color: var(--muted, #444);
  &:hover { background: rgba(0,0,0,0.03); }
`

const ModalOverlay = styled.div`
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
`

const ModalBox = styled.div`
  width: 520px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.2);
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
`

const Label = styled.label`
  font-size: 0.85rem;
  color: var(--muted, #555);
`

const TextInput = styled.input`
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
`

const ModalActions = styled.div`
  display:flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`

const SaveBtn = styled.button`
  background: var(--primary, #2563eb);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
`

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
`

export default function Capitulo() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ codigo: '', descricao: '' })

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
    setForm({ codigo: '', descricao: '' })
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ codigo: row.codigo || row.code || '', descricao: row.descricao || row.description || '' })
    setModalOpen(true)
  }

  async function save() {
    try {
      if (!form.codigo) return alert('Código é obrigatório')
      if (editing && editing.id) {
        await api.put(`/chapter/${editing.id}`, { codigo: form.codigo, descricao: form.descricao })
      } else {
        await api.post('/chapter', { codigo: form.codigo, descricao: form.descricao })
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
    return String(r.codigo || r.code || '').toLowerCase().includes(s) || String(r.descricao || r.description || '').toLowerCase().includes(s)
  })

  return (
    <Container>
      <Header>
        <Title>Capítulo - Gestão</Title>
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
                  <Td style={{fontWeight:600}}>{r.codigo || r.code}</Td>
                  <Td>{r.descricao || r.description}</Td>
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
              <TextInput value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
            </Field>
            <Field>
              <Label>Descrição</Label>
              <TextInput value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
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
