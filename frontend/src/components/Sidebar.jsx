import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { HelpCircle, Settings, LogOut, ChevronDown, ChevronRight, FileText } from "lucide-react";
import HelpModal from './HelpModal';
import Logo from './Logo'

const SidebarContainer = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 220px;
  background: #0b0b0b;
  color: #f5f5f5;
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
  color: #a8892a;
  text-align: left;
  margin-top: 0;
  margin-bottom: 12px;

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

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const GroupTitle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: transparent;
  color: #f5f5f5;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  padding: 6px 10px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: #1a1a1a;
    color: #a8892a;
  }

  svg {
    height: 18px;
    width: 18px;
    flex: 0 0 18px;
    color: inherit;
  }
  /* prevent wrapping for section titles */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* ensure consistent spacing between group titles so they align */
  &:not(:first-child) {
    margin-top: 8px;
  }
`;

const SubNav = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 0;
`;
// Move NavButton before SubButton because SubButton extends NavButton
const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  width: 100%;
  background: ${({ active }) => (active ? "#1a1a1a" : "transparent")};
  color: ${({ active }) => (active ? "#a8892a" : "#f5f5f5")};
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    background: #1a1a1a;
    color: #a8892a;
  }

  svg {
    height: 18px;
    width: 18px;
  }
`;

const SubButton = styled(NavButton)`
  padding: 8px 12px;
  background: transparent;
  color: #ddd;
  font-size: 0.85rem;
  border-radius: 6px;
  margin-left: 0;
  justify-content: flex-start;
  width: 100%;

  svg {
    height: 18px;
    width: 18px;
  }

  &:hover {
    color: #a8892a;
    background: #111;
  }

  /* prevent wrapping so labels stay in one line; use ellipsis if too long */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LogoutButton = styled(NavButton)`
  color: #ff6b6b;
  background: transparent;

  &:hover {
    background: rgba(255, 107, 107, 0.06);
    color: #ff8b8b;
  }
`;

const Footer = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const HelpButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  color: #888;
  border: none;
  padding: 10px 0;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    color: #a8892a;
  }
`;

export default function Sidebar() {
  const [toolsOpen, setToolsOpen] = useState(true);
  const [reformaOpen, setReformaOpen] = useState(true);
  const [consultaOpen, setConsultaOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // read user from localStorage to determine admin visibility
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {
    user = null;
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
    // navigate to login
    navigate('/login');
  };

  return (
    <SidebarContainer>
      <div>
        <Title><Logo size="180px" /></Title>
        <Nav>
          <Group>
            <GroupTitle onClick={() => setReformaOpen(v => !v)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText /> Reforma Tributária
              </div>
              <div>{reformaOpen ? <ChevronDown /> : <ChevronRight />}</div>
            </GroupTitle>

            {reformaOpen && (
              <>
                <SubNav>
                  <SubButton onClick={() => navigate('/')} active={location.pathname === '/'}>
                    Classificação Tributária
                  </SubButton>

                  {/* Consulta em Lote: toggleable group that contains Importar Planilha and Download de Modelo */}
                  <div>
                    <SubButton onClick={() => setConsultaOpen(v => !v)} active={location.pathname.startsWith('/consulta-lote') || location.pathname === '/import' || location.pathname === '/download-modelo'}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>Consulta em Lote</span>
                        <span>{consultaOpen ? <ChevronDown /> : <ChevronRight />}</span>
                      </div>
                    </SubButton>
                    {consultaOpen && (
                      <SubNav style={{ marginLeft: 8 }}>
                        <SubButton onClick={() => navigate('/import')} active={location.pathname === '/import'}>
                          Importar Planilha
                        </SubButton>
                        <SubButton onClick={() => navigate('/download-modelo')} active={location.pathname === '/download-modelo'}>
                          Download de Modelo
                        </SubButton>
                      </SubNav>
                    )}
                  </div>
                </SubNav>
              </>
            )}

            <GroupTitle onClick={() => setToolsOpen(v => !v)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText /> Ferramentas
              </div>
              <div>{toolsOpen ? <ChevronDown /> : <ChevronRight />}</div>
            </GroupTitle>

            {toolsOpen && (
              <>
                <SubNav>
                  <SubButton onClick={() => navigate('/tabela-ncm')} active={location.pathname === '/tabela-ncm'}>
                    Tabela NCM
                  </SubButton>
                  <SubButton onClick={() => navigate('/tabela-nbs')} active={location.pathname === '/tabela-nbs'}>
                    Tabela NBS
                  </SubButton>
                  <SubButton onClick={() => navigate('/tabela-cfops')} active={location.pathname === '/tabela-cfops'}>
                    Tabela CFOPS
                  </SubButton>
                </SubNav>
              </>
            )}
          </Group>
          {/* logout button removed from main nav and placed in footer */}
          {user?.role === 'admin' && (
            <NavButton
              active={location.pathname === "/admin"}
              onClick={() => navigate("/admin")}
            >
              <Settings /> Admin
            </NavButton>
          )}
        </Nav>
      </div>

      <Footer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LogoutButton onClick={handleLogout}>
            <LogOut /> Sair
          </LogoutButton>
          <HelpButton onClick={() => setHelpOpen(true)}>
            <HelpCircle /> Ajuda
          </HelpButton>
          {helpOpen && <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />}
        </div>
      </Footer>
    </SidebarContainer>
  );
}
