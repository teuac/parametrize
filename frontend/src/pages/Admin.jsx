import { useState } from 'react';
import styled from 'styled-components';
import AdminSidebar from '../components/AdminSidebar';
import UsersCrud from '../components/UsersCrud';

const Page = styled.div`
  display: flex;
`;

const Content = styled.main`
  flex: 1;
  padding: 28px;
  margin-left: 220px; /* space for fixed admin sidebar */
  box-sizing: border-box;

  @media (max-width: 768px) {
    margin-left: 0;
    padding-top: 16px;
  }
`;

export default function Admin(){
  const [view, setView] = useState('users');

  return (
    <Page>
      <AdminSidebar view={view} onChangeView={setView} />
      <Content>
        {view === 'users' && <UsersCrud />}
        {view === 'ncm' && (
          <div style={{ padding: 24 }}>
            <h2>Gestão de NCM</h2>
            <p>Área de gerenciamento de NCMs (em desenvolvimento).</p>
          </div>
        )}
      </Content>
    </Page>
  );
}