import { useState } from 'react'
import styled from 'styled-components'
import { api } from '../api/http'

const Container = styled.div`padding: 28px; max-width: 560px; margin: 32px auto;`;
const Card = styled.div`background:#0b0b0b;border:1px solid #222;border-radius:12px;padding:20px;color:#fff;`;
const Input = styled.input`width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;margin-bottom:12px;`;
const Button = styled.button`background:#a8892a;color:#0b0b0b;border:none;padding:10px 14px;border-radius:8px;cursor:pointer;`;
const Message = styled.p`color:#bbb;`;

export default function RecoverRequest(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try{
      await api.post('/auth/forgot', { email });
      setSent(true);
    }catch(e){
      setErr('Erro ao enviar solicitação');
    }
    setLoading(false);
  }

  return (
    <Container>
      <Card>
        <h2>Recuperar senha</h2>
        {!sent ? (
          <form onSubmit={submit}>
            <label>E-mail</label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <Button type="submit" disabled={loading}>{loading? 'Enviando...' : 'Enviar link de recuperação'}</Button>
            {err && <Message style={{color:'#ff6b6b'}}>{err}</Message>}
          </form>
        ) : (
          <div>
            <p>Se houver uma conta com este e-mail, você receberá um link para redefinir sua senha.</p>
          </div>
        )}
      </Card>
    </Container>
  )
}
