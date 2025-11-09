import React, { useState } from 'react';
import styled from 'styled-components';
import Ncm from './Ncm';
import ClasseTributaria from './ClasseTributaria';
import Capitulo from './Capitulo';
import Posicao from './Posicao';
import Subposicao from './Subposicao';

const Wrapper = styled.div`
  padding: 24px;
`;

const Tabs = styled.div`
  display:flex;
  gap:8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 16px;
`;

const Tab = styled.button`
  background: transparent;
  border: none;
  padding: 10px 14px;
  color: ${({ active, theme }) => (active ? (theme.name === 'dark' ? theme.colors.text : theme.colors.primary) : theme.colors.text)};
  border-bottom: 2px solid ${({ active, theme }) => (active ? theme.colors.accent : 'transparent')};
  cursor: pointer;
  font-weight: 600;
  &:hover { opacity: 0.9 }
`;

export default function NcmAdmin(){
  const tabs = [
    { key: 'ncm', label: 'NCM' },
    { key: 'classe', label: 'Classe Tributaria' },
    { key: 'capitulo', label: 'Capítulo' },
    { key: 'posicao', label: 'Posição' },
    { key: 'subposicao', label: 'Subposição' },
  ];

  const [active, setActive] = useState('ncm');

  return (
    <Wrapper>
      <h2>Gestão de NCM</h2>
      <p>Área de gerenciamento de NCMs.</p>

      <Tabs role="tablist" aria-label="Admin NCM Tabs">
        {tabs.map(t => (
          <Tab
            key={t.key}
            active={t.key === active}
            onClick={() => setActive(t.key)}
            role="tab"
            aria-selected={t.key === active}
          >
            {t.label}
          </Tab>
        ))}
      </Tabs>

      <div>
  {active === 'ncm' && <Ncm />}
        {active === 'classe' && <ClasseTributaria />}
        {active === 'capitulo' && <Capitulo />}
        {active === 'posicao' && <Posicao />}
        {active === 'subposicao' && <Subposicao />}
      </div>
    </Wrapper>
  );
}
