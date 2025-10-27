import React, { useState } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #0b0b0b;
  color: #f5f5f5;
  width: 420px;
  max-width: calc(100% - 40px);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.6);
`;

const Title = styled.h2`
  margin: 0 0 12px 0;
  color: #a8892a;
  font-size: 1.1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #222;
  background: #0f0f0f;
  color: #eee;
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #222;
  background: #0f0f0f;
  color: #eee;
  min-height: 120px;
  resize: vertical;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Button = styled.button`
  background: ${({ primary }) => (primary ? '#a8892a' : 'transparent')};
  color: ${({ primary }) => (primary ? '#0b0b0b' : '#f5f5f5')};
  border: ${({ primary }) => (primary ? 'none' : '1px solid #333')};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
`;

export default function HelpModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !message) return setError('Preencha e-mail e mensagem');
    setLoading(true);
    try {
      await api.post('/support', { email, message });
      setSent(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Erro ao enviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay>
      <Modal role="dialog" aria-modal="true">
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <Title>Ajuda / Suporte</Title>
            <Field>
              <label style={{ fontSize: 12, color: '#bbb' }}>Seu e-mail</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@exemplo.com" />
            </Field>
            <Field>
              <label style={{ fontSize: 12, color: '#bbb' }}>Sua dúvida</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva sua dúvida..." />
            </Field>
            {error && <div style={{ color: '#ff8b8b', marginBottom: 8 }}>{error}</div>}
            <Actions>
              <Button type="button" onClick={onClose} disabled={loading}>Fechar</Button>
              <Button type="submit" primary disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</Button>
            </Actions>
          </form>
        ) : (
          <div>
            <Title>Mensagem enviada</Title>
            <p style={{ color: '#ccc' }}>Sua dúvida foi enviada com sucesso. Em breve responderemos para o e-mail informado.</p>
            <Actions>
              <Button onClick={onClose} primary>Fechar</Button>
            </Actions>
          </div>
        )}
      </Modal>
    </Overlay>
  );
}
