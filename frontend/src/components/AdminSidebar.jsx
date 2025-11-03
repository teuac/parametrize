import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Users, Layers, ArrowLeft, LogOut, HelpCircle } from "lucide-react";
import Logo from './Logo'

const SidebarContainer = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 220px;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #222;
  padding: 30px 20px;
  box-sizing: border-box;
  z-index: 100;

  @media (max-width: 768px) {
    position: relative;
    width: 100%;
    height: auto;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    border-right: none;
    border-bottom: 1px solid #222;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.accent};
  text-align: center;
  margin-top: -30px;
  margin-bottom: -12px;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 10px;
  }
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ active, theme }) => (active ? theme.colors.hover : 'transparent')};
  color: ${({ active, theme }) => (active ? (theme.name === 'light' ? theme.colors.text : theme.colors.accent) : theme.colors.text)};
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
    color: ${({ theme }) => (theme.name === 'light' ? theme.colors.text : theme.colors.accent)};
  }

  svg { height: 18px; width: 18px }
`;

const Footer = styled.div`
  @media (max-width: 768px) { display:none }
`;

const LogoutButton = styled(NavButton)`
  color: #ff6b6b;
  &:hover { background: rgba(255,107,107,0.06); color: #ff8b8b }
`;

export default function AdminSidebar({ view, onChangeView }){
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    try{ localStorage.removeItem('token'); localStorage.removeItem('user'); }catch(e){}
    navigate('/login');
  }

  return (
    <SidebarContainer>
      <div>
  <Title><Logo size="180px" /></Title>
        <Nav>
          <NavButton active={view === 'users'} onClick={() => onChangeView('users')}>
            <Users /> Gestão de Usuário
          </NavButton>
          <NavButton active={view === 'ncm'} onClick={() => onChangeView('ncm')}>
            <Layers /> Gestão de NCM
          </NavButton>
          <NavButton active={view === 'support'} onClick={() => onChangeView('support')}>
            <HelpCircle /> Suporte
          </NavButton>
          <NavButton onClick={() => navigate('/') }>
            <ArrowLeft /> Voltar para a tela inicial
          </NavButton>
        </Nav>
      </div>

      <Footer>
        <LogoutButton onClick={handleLogout}><LogOut /> Sair</LogoutButton>
      </Footer>
    </SidebarContainer>
  );
}
