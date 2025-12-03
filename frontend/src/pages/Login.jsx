import { useState, useEffect } from "react";
import styled from "styled-components";
import { api } from "../api/http";
import Logo from '../components/Logo'
import { createGlobalStyle } from 'styled-components'

const Container = styled.div`
  /* make background full-bleed so it isn't affected by #root padding/margins */
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column; /* stack logo above card */
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at top left, #111 0%, #000 80%);
  color: #f5f5f5;
  font-family: "Inter", sans-serif;
  z-index: 0;

  /* no background logo (removed) */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: transparent;
    pointer-events: none;
    z-index: 0;
  }
`;

const LogoTop = styled.div`
  /* logo in the normal flow above the card; responsive sizing but constrained on small screens */
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  /* default: larger and closer to the card */
  margin-bottom: 8px;
  --logo-w: clamp(140px, 18vw, 220px);
  --logo-max-h: clamp(100px, 24vh, 240px);

  img, svg {
    width: var(--logo-w);
    max-height: var(--logo-max-h);
    height: auto;
    display: block;
    object-fit: contain;
  }

  /* small screens (phones) — keep logo smaller and with more gap so it never invades the card */
  @media (max-width: 480px) {
    --logo-w: clamp(90px, 28vw, 140px);
    --logo-max-h: 84px;
    margin-bottom: 16px;
  }

  /* large screens — make it more prominent and closer */
  @media (min-width: 1024px) {
    /* make logo even larger on wide screens (up to 300px) and bring it a bit closer */
    --logo-w: clamp(200px, 16vw, 300px);
    --logo-max-h: 300px;
    margin-bottom: 4px;
  }
`;



const Card = styled.div`
  background: #0b0b0b;
  border: 1px solid #222;
  border-radius: 20px;
  /* reduce top padding only so the top area is smaller */
  padding: 20px 32px 40px;
  width: 100%;
  max-width: 400px;
  /* subtle drop shadow for depth; main glow moved to ::before border only */
  box-shadow: 0 8px 22px rgba(0,0,0,0.6);
  text-align: center;
  position: relative;
  z-index: 2;
  --glow-color: #A8892A;
  --glow-size: 18px;

  /* animated border glow (subtle) */
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 22px;
    background: transparent;
    /* small, focused glow on the border */
    box-shadow: 0 0 6px rgba(168,137,42,0.08);
    z-index: -1;
    filter: none;
    transform: translateZ(0);
    animation: pulseGlow 4s ease-in-out infinite;
    pointer-events: none;
  }
`;

const pulseKeyframes = `
@keyframes pulseGlow {
  0% { transform: scale(1); box-shadow: 0 0 4px rgba(168,137,42,0.06); }
  50% { transform: scale(1.01); box-shadow: 0 0 12px rgba(168,137,42,0.14); }
  100% { transform: scale(1); box-shadow: 0 0 4px rgba(168,137,42,0.06); }
}
`;

// Inject keyframes into the document when this module is imported so styled-components can use them
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-generated', 'login-glow');
  styleEl.innerHTML = pulseKeyframes;
  document.head.appendChild(styleEl);
}

const LoginOverrides = createGlobalStyle`
  /* when login is active we remove #root padding/max-width so the background can be full-bleed */
  html.login-full-bleed,
  html.login-full-bleed body {
    /* match the Login Container background to avoid any white edges from system/light-mode defaults */
    background: radial-gradient(circle at top left, #111 0%, #000 80%) !important;
    min-height: 100vh;
  }
  html.login-full-bleed #root {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }
`;

const Title = styled.h1`
  color: #A8892A;
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
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 0;
  border-radius: 10px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #fff;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    border-color: #A8892A;
    outline: none;
  }
`;

const PasswordRow = styled.div`
  width: 90%;
  max-width: 320px;
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

const FormRow = styled.div`
  width: 90%;
  max-width: 320px;
  margin-bottom: 8px;
`;

const Button = styled.button`
  width: 90%;
  max-width: 320px;
  padding: 12px 14px;
  background: linear-gradient(180deg, #BFA032 0%, #A8892A 100%);
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
  box-shadow: 0 10px 28px rgba(168,137,42,0.18), inset 0 -2px 0 rgba(0,0,0,0.14);
    filter: saturate(1.05) brightness(1.02);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 6px 12px rgba(0,0,0,0.35), inset 0 2px 6px rgba(0,0,0,0.25);
  }

  &:focus {
    outline: none;
      box-shadow: 0 0 0 6px rgba(168,137,42,0.12), 0 8px 22px rgba(0,0,0,0.4);
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
  useEffect(() => {
    document.documentElement.classList.add('login-full-bleed');
    return () => document.documentElement.classList.remove('login-full-bleed');
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <LoginOverrides />
      <LogoTop>
        <Logo size="140px" />
      </LogoTop>
      <Card>
        <Title>Bem Vindo</Title>
        <Subtitle>Entre com suas credenciais</Subtitle>
        <Form onSubmit={submit}>
          <FormRow>
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormRow>

          <FormRow style={{ marginBottom: 6 }}>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ marginTop: 4, textAlign: 'left' }}>
              <a href="/recover" style={{ color: '#A8892A', fontSize: '0.9rem', textDecoration: 'none' }}>Esqueci a minha senha</a>
            </div>
          </FormRow>

          <Button type="submit">Entrar</Button>
        </Form>
        {err && <ErrorMsg>{err}</ErrorMsg>}
      </Card>
    </Container>
  );
}