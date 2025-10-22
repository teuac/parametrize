import { useState, useEffect } from "react";
import styled from "styled-components";
import { api } from "../api/http";
import Sidebar from "../components/Sidebar";
import { createGlobalStyle } from 'styled-components'

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
  background: #0b0b0b;
  color: #f5f5f5;
`;

const DashboardOverrides = createGlobalStyle`
  html.app-full-bleed,
  html.app-full-bleed body {
    background: #0b0b0b !important;
    min-height: 100vh;
  }
  html.app-full-bleed #root {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 40px 40px 60px 260px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const SearchBar = styled.div`
  position: relative;
  max-width: 600px;
  margin: 0 auto 40px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  input {
    width: 100%;
    padding: 14px 18px;
    border-radius: 10px;
    border: 1px solid #333;
    background: #1a1a1a;
    color: #fff;
    font-size: 1rem;
    transition: all 0.2s ease;

    &:focus {
      border-color: #a8892a;
      outline: none;
      box-shadow: 0 0 6px rgba(168, 137, 42, 0.5);
    }
  }
`;

const SuggestionBox = styled.div`
  background: #111;
  border: 1px solid #333;
  border-radius: 10px;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 0 10px rgba(168, 137, 42, 0.15);
`;

const SuggestionItem = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  transition: 0.2s;
  color: #ddd;

  &:hover {
    background: #1f1f1f;
    color: #a8892a;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: #111;
  border: 1px solid #222;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 0 15px rgba(168, 137, 42, 0.08);
  transition: 0.2s;
  position: relative;

  &:hover {
    border-color: #a8892a;
    transform: translateY(-2px);
  }
`;

const NcmCode = styled.h2`
  color: #a8892a;
  font-size: 1.3rem;
  margin-bottom: 6px;
`;

const NcmDesc = styled.p`
  color: #ccc;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const Section = styled.div`
  margin-top: 10px;
  background: #1a1a1a;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  color: #eee;

  strong {
    color: #a8892a;
  }

  p {
    margin: 4px 0;
  }
`;
const EmptyMessage = styled.div`
  text-align: center;
  color: #aaa;
  font-size: 1rem;
  margin-top: 60px;
  padding: 40px;
  background: #111;
  border-radius: 12px;
  border: 1px dashed #333;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    padding: 20px;
  }
`;

export default function Dashboard() {
  useEffect(() => {
    document.documentElement.classList.add('app-full-bleed');
    return () => document.documentElement.classList.remove('app-full-bleed');
  }, []);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [items, setItems] = useState([]);

  async function fetchSuggestions(value) {
    if (!value.trim()) return setSuggestions([]);
    try {
      const { data } = await api.get("/ncm", { params: { q: value } });
      setSuggestions(data.slice(0, 5)); // só 5 sugestões
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    }
  }

  async function searchNcm(code) {
    setQuery(code);
    setSuggestions([]);
    try {
      const { data } = await api.get("/ncm", { params: { q: code } });
      setItems(data);
    } catch (err) {
      console.error("Erro ao buscar NCM:", err);
    }
  }

  return (
    <>
      <DashboardOverrides />
      <Layout>
      <Sidebar />

      <Content>
        <SearchBar>
          <input
            placeholder="Digite o código ou descrição do NCM..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              fetchSuggestions(e.target.value);
            }}
          />

          {suggestions.length > 0 && (
            <SuggestionBox>
              {suggestions.map((s) => (
                <SuggestionItem
                  key={`${s.codigo}-${s.cClasstrib}`}
                  onClick={() => searchNcm(s.codigo)}
                >
                  {s.codigo} — {s.descricao}
                </SuggestionItem>
              ))}
            </SuggestionBox>
          )}
        </SearchBar>
{items.length === 0 && !query.trim() ? (
  <EmptyMessage>
    🔍 Digite um código ou descrição de NCM para começar a consulta.
  </EmptyMessage>
) : items.length === 0 ? (
  <EmptyMessage>Nenhum resultado encontrado.</EmptyMessage>
) : (
  <Grid>
    {items.map((item) => (
      <Card key={`${item.codigo}-${item.cClasstrib}`}>
        <NcmCode>{item.codigo}</NcmCode>
        <NcmDesc>{item.descricao}</NcmDesc>

        {item.classTrib && (
          <Section>
            <strong>Classificação Tributária</strong>
            <p>
              <strong>Código:</strong>{" "}
              {item.classTrib.codigoClassTrib
                ?.toString()
                .padStart(6, "0")}
            </p>
            <p>
              <strong>CST:</strong> {item.classTrib.cstIbsCbs || "—"}
            </p>
            <p>
              <strong>Descrição:</strong>{" "}
              {item.classTrib.descricaoClassTrib || "—"}
            </p>
            <p>
              <strong>Redução IBS/CBS:</strong>{" "}
              {item.classTrib.pRedIBS}% / {item.classTrib.pRedCBS}%
            </p>
          </Section>
        )}
      </Card>
    ))}
  </Grid>
)}

      </Content>
    </Layout>
    </>
  );
}
