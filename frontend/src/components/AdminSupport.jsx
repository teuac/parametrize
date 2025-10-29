import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';

const Container = styled.div`padding: 24px;`;
const Row = styled.div`display:flex;gap:12px;align-items:flex-start;padding:12px;border-bottom:1px solid #111;`;
const Col = styled.div`flex:1;min-width:0;`;
const Small = styled.div`font-size:12px;color:#999;`;
const Protocol = styled.div`font-weight:700;color:#a8892a;`;
const Search = styled.input`padding:8px;border-radius:6px;border:1px solid #222;background:#0f0f0f;color:#eee;margin-bottom:12px;`;

export default function AdminSupport(){
  const [q, setQ] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
            <Small>{t.status}</Small>
          </Col>
          <Col>
            <div style={{fontWeight:600}}>{t.email}</div>
            <div style={{marginTop:8, whiteSpace:'pre-wrap', color:'#ddd'}}>{t.message}</div>
          </Col>
        </Row>
      ))}
    </Container>
  );
}
