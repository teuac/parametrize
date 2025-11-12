import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../api/http';
import { useNavigate } from 'react-router-dom';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  max-width: 520px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h3`
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.primary};
  margin: -20px -20px 12px -20px;
  padding: 12px 16px;
  text-align: center;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
`;

const Button = styled.button`
  background: ${({ primary, theme }) => (primary ? theme.colors.accent : 'transparent')};
  color: ${({ primary, theme }) => (primary ? theme.colors.primary : theme.colors.text)};
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
`;

export default function ChangePasswordModal({ open, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setCountdown(5);
    }
  }, [open]);

  useEffect(() => {
    let t;
    if (success) {
      t = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(t);
            // clear token and user and redirect to login
            try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
            navigate('/login');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [success, navigate]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não corresponde.');
      return;
    }
    // optional: enforce minimum length
    if (newPassword.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const payload = { oldPassword, newPassword };
      const { data } = await api.post('/auth/change', payload);
      if (data && data.ok) {
        setSuccess('Senha alterada com sucesso. Você será redirecionado para o login em');
      } else {
        setError('Resposta inesperada do servidor.');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Erro ao alterar senha';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalBox>
        <ModalTitle>Alterar senha</ModalTitle>
        <form onSubmit={handleSubmit}>
          <Field>
            <label>Senha atual</label>
            <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          </Field>
          <Field>
            <label>Nova senha</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <Field>
            <label>Confirme a nova senha</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>

          {error && <div style={{ color: '#c53d3d', marginTop: 6 }}>{error}</div>}
          {success && (
            <div style={{ color: '#2a8a2a', marginTop: 6 }}>
              {success} <strong>{countdown}</strong> segundos...
            </div>
          )}

          <Actions>
            <Button type="button" onClick={onClose} disabled={loading || !!success}>Cancelar</Button>
            <Button primary type="submit" disabled={loading || !!success}>{loading ? '...' : 'Alterar'}</Button>
          </Actions>
        </form>
      </ModalBox>
    </ModalOverlay>
  );
}
