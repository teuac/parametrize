import { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { api } from "../api/http";
import Sidebar from "../components/Sidebar";
import { Search } from "lucide-react";

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
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    flex: 1;
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

  button {
    background: #a8892a;
    border: none;
    border-radius: 10px;
    color: #0b0b0b;
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: 0.3s;

    &:hover {
      background: #b69733;
    }

    svg {
      height: 20px;
      width: 20px;
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
  max-width: 600px;
  margin: 0 auto;
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

const NcmGroup = styled.div`
  margin-bottom: 30px;
  border: 1px solid #222;
  border-radius: 12px;
  overflow: hidden;
`;

const NcmHeader = styled.div`
  background: ${({ pinned }) => (pinned ? "#a8892a" : "#1a1a1a")};
  color: ${({ pinned }) => (pinned ? "#0b0b0b" : "#f5f5f5")};
  font-weight: 600;
  padding: 14px 18px;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: ${({ pinned }) => (pinned ? "#b69733" : "#2a2a2a")};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  padding: 16px;
  background: #111;
`;

const Card = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 0 10px rgba(168, 137, 42, 0.08);
`;

const Section = styled.div`
  font-size: 0.9rem;
  color: #eee;

  strong {
    color: #a8892a;
  }

  p {
    margin: 4px 0;
  }
`;

const InfoMessage = styled.p`
  text-align: center;
  color: #aaa;
  font-size: 0.95rem;
  margin-bottom: 20px;
`;

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [items, setItems] = useState([]);
  const [pinnedCodes, setPinnedCodes] = useState([]);

  useEffect(() => {
    document.documentElement.classList.add("app-full-bleed");
    return () => document.documentElement.classList.remove("app-full-bleed");
  }, []);

  async function fetchSuggestions(value) {
    if (!value.trim()) return setSuggestions([]);
    try {
      const { data } = await api.get("/ncm", { params: { q: value } });
      setSuggestions(data.slice(0, 5));
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    }
  }

  async function searchNcm(code) {
    setQuery(code);
    setSuggestions([]);
    try {
      const { data } = await api.get("/ncm", { params: { q: code } });
      // mantém os itens já travados
      const pinnedItems = items.filter((i) => pinnedCodes.includes(i.codigo));
      setItems([...pinnedItems, ...data]);
    } catch (err) {
      console.error("Erro ao buscar NCM:", err);
    }
  }

  function togglePin(codigo) {
    setPinnedCodes((prev) =>
      prev.includes(codigo)
        ? prev.filter((c) => c !== codigo)
        : [...prev, codigo]
    );
  }

  // Agrupa por código NCM
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.codigo]) acc[item.codigo] = [];
    acc[item.codigo].push(item);
    return acc;
  }, {});

  return (
    <>
      <DashboardOverrides />
      <Layout>
        <Sidebar />
        <Content>
          <InfoMessage>
             Digite um código ou descrição de NCM e clique na lupa para buscar.
          </InfoMessage>

          <SearchBar>
            <input
              placeholder="Buscar por código ou descrição..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                fetchSuggestions(e.target.value);
              }}
            />
            <button onClick={() => searchNcm(query)}>
              <Search />
            </button>
          </SearchBar>

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

          {/* Se não houver resultados */}
          {Object.keys(groupedItems).length === 0 && !query.trim() && (
            <InfoMessage>
              ✨ Nenhuma pesquisa realizada ainda. Comece digitando acima.
            </InfoMessage>
          )}

          {/* Renderiza grupos */}
          {Object.entries(groupedItems).map(([codigo, group]) => (
            <NcmGroup key={codigo}>
              <NcmHeader
                pinned={pinnedCodes.includes(codigo)}
                onClick={() => togglePin(codigo)}
              >
                <span>{codigo}</span>
                <span>
                  {pinnedCodes.includes(codigo)
                    ? "📌 Fixado"
                    : "📍 Clique para fixar"}
                </span>
              </NcmHeader>

              <Grid>
                {group.map((item) => (
                  <Card key={`${item.codigo}-${item.cClasstrib}`}>
                    {item.classTrib && (
                      <Section>
                        <p>
                          <strong>Código:</strong>{" "}
                          {item.classTrib.codigoClassTrib
                            ?.toString()
                            .padStart(6, "0")}
                        </p>
                        <p>
                          <strong>CST:</strong>{" "}
                          {item.classTrib.cstIbsCbs || "—"}
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
            </NcmGroup>
          ))}
        </Content>
      </Layout>
    </>
  );
}
