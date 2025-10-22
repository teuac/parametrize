import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Home, Upload, HelpCircle } from "lucide-react";
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

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 10px;
  }
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ active }) => (active ? "#1a1a1a" : "transparent")};
  color: ${({ active }) => (active ? "#a8892a" : "#f5f5f5")};
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
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
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    color: #a8892a;
  }
`;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarContainer>
      <div>
        <Title><Logo size="180px" /></Title>
        <Nav>
          <NavButton
            active={location.pathname === "/dashboard"}
            onClick={() => navigate("/dashboard")}
          >
            <Home /> Consulta
          </NavButton>
          <NavButton
            active={location.pathname === "/import"}
            onClick={() => navigate("/import")}
          >
            <Upload /> Importar
          </NavButton>
        </Nav>
      </div>

      <Footer>
        <HelpButton onClick={() => alert("Ajuda: suporte@parametrizze.com")}>
          <HelpCircle /> Ajuda
        </HelpButton>
      </Footer>
    </SidebarContainer>
  );
}
