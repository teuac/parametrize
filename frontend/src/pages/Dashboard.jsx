import { useEffect, useState } from 'react';
import { api } from '../api/http';

export default function Dashboard(){
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);

  async function search(){
    const { data } = await api.get('/ncm', { params: { q }});
    setItems(data);
  }

  useEffect(()=>{ search(); }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Parametrizze</h1>
      <input placeholder="buscar NCM" value={q} onChange={e=>setQ(e.target.value)} />
      <button onClick={search}>Buscar</button>
      <ul>
        {items.map(i => <li key={i.id}>{i.codigo} — {i.descricao}</li>)}
      </ul>
    </div>
  );
}