import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { api } from '../api/http'

const Container = styled.div`padding: 28px; max-width: 560px; margin: 32px auto;`;
const Card = styled.div`background:#0b0b0b;border:1px solid #222;border-radius:12px;padding:20px;color:#fff;`;
const Input = styled.input`width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;margin-bottom:12px;`;
const Button = styled.button`background:#a8892a;color:#0b0b0b;border:none;padding:10px 14px;border-radius:8px;cursor:pointer;`;
const Message = styled.p`color:#bbb;`;

export default function RecoverReset(){
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if(password.length < 6){ setMsg('Senha deve ter pelo menos 6 caracteres'); return }
    if(password !== confirm){ setMsg('Senhas não conferem'); return }
    setLoading(true);
    try{
      await api.post('/auth/reset', { token, password });
      setMsg('Senha alterada com sucesso. Redirecionando para login...');
      setTimeout(()=>navigate('/login'), 1500);
    }catch(e){ setMsg(e.response?.data?.error || 'Erro ao redefinir senha') }
    setLoading(false);
  }

  return (
    <Container>
      <Card>
        <h2>Redefinir senha</h2>
        {!token ? (
          <p>Token de redefinição ausente. Verifique o link recebido por e-mail.</p>
        ) : (
          <form onSubmit={submit}>
            <label>Nova senha</label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <label>Confirme a nova senha</label>
            <Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
            <Button type="submit" disabled={loading}>{loading? 'Processando...' : 'Salvar nova senha'}</Button>
            {msg && <Message style={{marginTop:12}}>{msg}</Message>}
          </form>
        )}
      </Card>
    </Container>
  )
}
