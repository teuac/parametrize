import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Users, Layers, ArrowLeft, LogOut, HelpCircle, Sun, Moon } from "lucide-react";
import Logo from './Logo'
import { useAppTheme } from '../contexts/ThemeContext'

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

const SwitchWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SwitchButton = styled.button`
  --w: 64px;
  position: relative;
  width: var(--w);
  height: 34px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;
  box-sizing: border-box;

  svg { flex: 0 0 18px; color: ${({ theme }) => theme.colors.text}; }

  &:focus { outline: 2px solid ${({ theme }) => theme.colors.accent}; outline-offset: 2px; }
`;

const SwitchThumb = styled.span`
  position: absolute;
  top: 4px;
  left: ${(p) => (p.on ? '4px' : 'calc(var(--w) - 30px)')};
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  transition: left 180ms ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
`;

export default function AdminSidebar({ view, onChangeView }){
  const navigate = useNavigate();
  const location = useLocation();
  const { themeName, setThemeName } = useAppTheme();

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'inherit' }}>Tema</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SwitchWrap>
                <SwitchButton onClick={() => setThemeName(themeName === 'light' ? 'dark' : 'light')} aria-label="Alternar tema" title="Alternar tema">
                  <Sun size={16} />
                  <Moon size={16} />
                  <SwitchThumb on={themeName === 'light'} />
                </SwitchButton>
              </SwitchWrap>
            </div>
          </div>

          <LogoutButton onClick={handleLogout}><LogOut /> Sair</LogoutButton>
        </div>
      </Footer>
    </SidebarContainer>
  );
}
