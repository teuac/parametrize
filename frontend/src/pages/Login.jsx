import { useState } from "react";
import styled from "styled-components";
import { api } from "../api/http";

const Container = styled.div`
  /* make background full-bleed so it isn't affected by #root padding/margins */
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at top left, #111 0%, #000 80%);
  color: #f5f5f5;
  font-family: "Inter", sans-serif;
`;

const Card = styled.div`
  background: #0b0b0b;
  border: 1px solid #222;
  border-radius: 20px;
  padding: 40px 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 0 25px rgba(179, 107, 0, 0.15);
  text-align: center;
  position: relative;
  --glow-color: #eead2d;
  --glow-size: 18px;

  /* animated outline using a pseudo element */
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 22px;
  background: linear-gradient(90deg, rgba(179,107,0,0.08), rgba(255,255,255,0.02), rgba(179,107,0,0.08));
  box-shadow: 0 0 var(--glow-size) var(--glow-color);
    opacity: 0.85;
    z-index: -1;
    filter: blur(6px);
    transform: translateZ(0);
    animation: pulseGlow 3.5s ease-in-out infinite;
    pointer-events: none;
  }
`;

const pulseKeyframes = `
@keyframes pulseGlow {
  0% { transform: scale(0.98); box-shadow: 0 0 6px rgba(179,107,0,0.08); opacity: 0.7; }
  50% { transform: scale(1.02); box-shadow: 0 0 22px rgba(179,107,0,0.28); opacity: 1; }
  100% { transform: scale(0.98); box-shadow: 0 0 6px rgba(179,107,0,0.08); opacity: 0.7; }
}
`;

// Inject keyframes into the document when this module is imported so styled-components can use them
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-generated', 'login-glow');
  styleEl.innerHTML = pulseKeyframes;
  document.head.appendChild(styleEl);
}

const Title = styled.h1`
  color: #B8860B;
  font-size: 1.8rem;
  margin-bottom: 10px;
  letter-spacing: 1px;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: #bbb;
  margin-bottom: 32px;
`;

const Input = styled.input`
  width: 90%;
  max-width: 320px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 10px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #fff;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    border-color: #B8860B;
    outline: none;
  }
`;

const Button = styled.button`
  width: 90%;
  max-width: 320px;
  padding: 12px 14px;
  background: linear-gradient(180deg, #B8860B 0%, #B8860B 100%);
  color: #0b0b0b;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(179,107,0,0.12), inset 0 -2px 0 rgba(0,0,0,0.12);
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
  will-change: transform;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(179,107,0,0.18), inset 0 -2px 0 rgba(0,0,0,0.14);
    filter: saturate(1.05) brightness(1.02);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 6px 12px rgba(0,0,0,0.35), inset 0 2px 6px rgba(0,0,0,0.25);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 6px rgba(179,107,0,0.12), 0 8px 22px rgba(0,0,0,0.4);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const ErrorMsg = styled.p`
  color: #ff6b6b;
  margin-top: 10px;
  font-size: 0.9rem;
`;

export default function Login() {
  const [email, setEmail] = useState("admin@parametrizze.com");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (e) {
      setErr(e.response?.data?.error || "Erro ao entrar");
    }
  }

  return (
    <Container>
      <Card>
        <Title>Parametrize</Title>
        <Subtitle>Entre com suas credenciais</Subtitle>
        <Form onSubmit={submit}>
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit">Entrar</Button>
        </Form>
        {err && <ErrorMsg>{err}</ErrorMsg>}
      </Card>
    </Container>
  );
}
