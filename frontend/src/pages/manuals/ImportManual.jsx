import React from 'react';
import { useTheme } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import styled from 'styled-components';
import { DownloadCloud, FilePlus, UploadCloud, AlertTriangle, CheckCircle } from 'lucide-react';

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`;

const Container = styled.div`
  margin-left: 240px;
  padding: 32px;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  width: 760px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 26px rgba(0,0,0,0.06);
`;

const Title = styled.h2`
  margin: 0 0 12px 0;
  color: ${({ theme }) => theme.colors.accent};
  text-align: left;
`;

const Intro = styled.p`
  margin: 0 0 18px 0;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.95;
`;

const Step = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 14px;

  .num {
    min-width: 36px;
    height: 36px;
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.primary};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .content {
    flex: 1;
  }

  strong { color: ${({ theme }) => theme.colors.text}; }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 18px;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.primary};
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  align-items: center;

  &:hover { filter: brightness(0.95); }
`;

export default function ImportManual() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Page>
      <Sidebar />
      <Container>
        <Card>
          <Title>Manual — Consulta em Lote</Title>
          <Intro>Veja abaixo um passo a passo rápido para realizar consultas em lote. As cores da tela respeitam o tema atual (claro/escuro).</Intro>

          <Step>
            <div className="num">1</div>
            <div className="content"><strong>Baixe o modelo:</strong> Vá em <em>Reforma Tributária &gt; Consulta em lote &gt; Download de modelo</em> e baixe o arquivo de exemplo.</div>
          </Step>

          <Step>
            <div className="num">2</div>
            <div className="content"><strong>Abra o modelo:</strong> Abra o arquivo baixado no seu programa de planilha eletrônica (Excel, LibreOffice, Google Sheets, etc.).</div>
          </Step>

          <Step>
            <div className="num">3</div>
            <div className="content"><strong>Insira os códigos:</strong> Preencha os códigos a serem pesquisados na coluna <code>"NCM"</code>. Cada linha representa uma consulta única. Evite linhas vazias antes do cabeçalho.</div>
          </Step>

          <Step>
            <div className="num">4</div>
            <div className="content"><strong>Importe a planilha:</strong> Volte para <em>Reforma Tributária &gt; Consulta em Lote &gt; Importar planilha</em> e clique no ícone para selecionar o arquivo preenchido.</div>
          </Step>

          <Step>
            <div className="num">5</div>
            <div className="content"><strong>Processar:</strong> Clique em <em>Processar</em>. Se houver códigos duplicados, ou se a sua cota diária não for suficiente, o sistema irá avisar antes de prosseguir. Veja os exemplos e confirme.</div>
          </Step>

          <Step>
            <div className="num">6</div>
            <div className="content"><strong>Download automático:</strong> Ao terminar, o sistema faz o download automático da planilha com os resultados (cabeçalhos posicionados na linha 9).</div>
          </Step>

          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertTriangle color={theme.colors.accent} />
            <div style={{ color: theme.colors.text, opacity: 0.9 }}>Observação: códigos duplicados são ignorados — você será informado e poderá optar por processar apenas os códigos únicos até o limite disponível.</div>
          </div>

          <Actions>
            <ActionButton onClick={() => navigate('/download-modelo')}><DownloadCloud size={16} /> Baixar modelo</ActionButton>
            <ActionButton onClick={() => navigate('/import')}><UploadCloud size={16} /> Ir para Importar</ActionButton>
          </Actions>
        </Card>
      </Container>
    </Page>
  );
}
