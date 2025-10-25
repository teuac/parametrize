import { useEffect, useState } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Box = styled.div`
  background: #0b0b0b;
  color: #fff;
  padding: 24px;
  border-radius: 12px;
  width: min(92vw, 420px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  border: 1px solid #222;
  text-align: center;
`;

const Title = styled.h3`
  margin: 0 0 12px 0;
  color: #A8892A;
`;

const Text = styled.p`
  margin: 0 0 18px 0;
  color: #ddd;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const Btn = styled.button`
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
`;

const LoginBtn = styled(Btn)`
  background: #A8892A;
  color: #0b0b0b;
`;

const CancelBtn = styled(Btn)`
  background: #222;
  color: #fff;
`;

export default function SessionExpiredModal() {
  const [open, setOpen] = useState(false);
  const [returnTo, setReturnTo] = useState('/');
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const handler = (e) => {
      const rt = e?.detail?.returnTo || window.location.pathname + window.location.search;
      setReturnTo(rt);
      // ensure token cleared
      try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
      setOpen(true);
      setCountdown(6);
    };
    window.addEventListener('sessionExpired', handler);
    return () => window.removeEventListener('sessionExpired', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (countdown <= 0) {
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, countdown, returnTo]);

  if (!open) return null;

  return (
    <Overlay>
      <Box role="dialog" aria-modal="true">
        <Title>Sessão expirada</Title>
        <Text>Sua sessão expirou por inatividade. Você será redirecionado para fazer login em {countdown}s.</Text>
        <Actions>
          <LoginBtn onClick={() => window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`}>
            Ir para login
          </LoginBtn>
          <CancelBtn onClick={() => setOpen(false)}>Fechar</CancelBtn>
        </Actions>
      </Box>
    </Overlay>
  );
}
