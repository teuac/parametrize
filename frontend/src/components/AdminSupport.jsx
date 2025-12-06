import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';

const Container = styled.div`padding: 24px;`;
const Row = styled.div`display:flex;gap:12px;align-items:flex-start;padding:12px;border-bottom:1px solid #111;`;
const Col = styled.div`flex:1;min-width:0;`;
const Small = styled.div`font-size:12px;color:#999;`;
const Protocol = styled.div`font-weight:700;color:#a8892a;`;
const Search = styled.input`padding:8px;border-radius:6px;border:1px solid #222;background:#0f0f0f;color:#eee;margin-bottom:12px;`;
const StatusSelect = styled.select`
  padding:4px 8px;
  border-radius:4px;
  border:1px solid #333;
  background:#1a1a1a;
  color:#eee;
  font-size:12px;
  cursor:pointer;
  &:hover{ border-color:#a8892a; }
  &:focus{ outline:none; border-color:#a8892a; }
`;
const StatusBadge = styled.span`
  display:inline-block;
  padding:2px 8px;
  border-radius:4px;
  font-size:11px;
  font-weight:600;
  background: ${p => 
    p.status === 'novo' ? '#444' : 
    p.status === 'em atendimento' ? '#a8892a' : 
    '#2a8a2a'
  };
  color: ${p => p.status === 'novo' ? '#ddd' : '#fff'};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalBox = styled.div`
  background: #0b0b0b;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
`;

const ModalTitle = styled.h3`
  color: #a8892a;
  margin: 0 0 16px 0;
  font-size: 1.2rem;
`;

const ModalText = styled.p`
  color: #ddd;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${p => p.primary ? `
    background: linear-gradient(180deg, #BFA032 0%, #A8892A 100%);
    color: #0b0b0b;
    &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(168,137,42,0.3); }
  ` : `
    background: #1a1a1a;
    color: #ddd;
    border: 1px solid #333;
    &:hover { background: #222; border-color: #444; }
  `}
  
  &:active { transform: translateY(0); }
`;

export default function AdminSupport(){
  const [q, setQ] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchTickets = async (search) => {
    setLoading(true);
    setError(null);
    try{
      const res = await api.get('/support', { params: { q: search } });
      setTickets(res.data || []);
    }catch(err){
      console.error(err);
      setError('Erro ao buscar dúvidas');
    }finally{ setLoading(false); }
  }

  const handleStatusChange = (ticketId, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return;
    setConfirmModal({ ticketId, currentStatus, newStatus });
  }

  const confirmStatusChange = async () => {
    if (!confirmModal) return;
    try{
      await api.patch(`/support/${confirmModal.ticketId}/status`, { status: confirmModal.newStatus });
      setConfirmModal(null);
      fetchTickets(q);
    }catch(err){
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status');
    }
  }

  const cancelStatusChange = () => {
    setConfirmModal(null);
  }

  useEffect(()=>{ fetchTickets(''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets(q);
  }

  return (
    <Container>
      <h2>Suporte / Dúvidas</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
        <Search placeholder="Protocolo ou parte do protocolo" value={q} onChange={(e)=>setQ(e.target.value)} />
      </form>
      {loading && <div style={{color:'#ccc'}}>Carregando...</div>}
      {error && <div style={{color:'#ff8b8b'}}>{error}</div>}
      {!loading && tickets.length === 0 && <div style={{color:'#999'}}>Nenhuma dúvida encontrada.</div>}
      {tickets.map(t => (
        <Row key={t.id}>
          <Col style={{flex:'0 0 200px'}}>
            <Protocol>{t.protocol}</Protocol>
            <Small>{new Date(t.createdAt).toLocaleString()}</Small>
            <div style={{marginTop:8}}>
              <StatusSelect 
                value={t.status} 
                onChange={(e) => handleStatusChange(t.id, t.status, e.target.value)}
              >
                <option value="novo">Novo</option>
                <option value="em atendimento">Em atendimento</option>
                <option value="atendido">Atendido</option>
              </StatusSelect>
            </div>
          </Col>
          <Col>
            <div style={{fontWeight:600}}>{t.email}</div>
            <div style={{marginTop:8, whiteSpace:'pre-wrap', color:'#ddd'}}>{t.message}</div>
          </Col>
        </Row>
      ))}
      
      {confirmModal && (
        <ModalOverlay onClick={cancelStatusChange}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Confirmar alteração de status</ModalTitle>
            <ModalText>
              Tem certeza que deseja alterar o status deste ticket de <strong>{confirmModal.currentStatus}</strong> para <strong>{confirmModal.newStatus}</strong>?
            </ModalText>
            <ModalActions>
              <ModalButton onClick={cancelStatusChange}>Cancelar</ModalButton>
              <ModalButton primary onClick={confirmStatusChange}>Confirmar</ModalButton>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
  );
}
