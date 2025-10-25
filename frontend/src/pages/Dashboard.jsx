import { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { api } from "../api/http";
import Sidebar from "../components/Sidebar";
import { Search, BookOpen, File, FileSpreadsheet, FileText } from "lucide-react";

/* ======= STYLES ======= */
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

/* 🔹 NOVOS ESTILOS DO TOPO 🔹 */
const SearchWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch; /* allow left-aligning the message + search bar */
  margin-bottom: 40px;
`;

const InfoMessage = styled.p`
  color: #aaa;
  font-size: 0.95rem;
  margin-bottom: 12px;
  text-align: center; /* center above the search bar */
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchContainer = styled.div`
  position: relative; /* needed so ReportButtons can be absolute-cornered */
  display: flex;
  align-items: center;
  justify-content: center; /* center the search bar */
  gap: 24px;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchBar = styled.div`
  flex: 0 1 auto;
  width: 100%;
  max-width: 700px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto; /* keep the search bar exactly centered */

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
      margin-right: 4px;
    }
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0 12px;
  }
`;

const ReportButtons = styled.div`
  position: absolute; /* pin to the right corner of SearchContainer */
  right: 0;
  top: 50%;
  transform: translateY(-50%) translateX(80px); /* nudge buttons a bit left compared to before */
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 200px;

  button {
    background: #a8892a;
    color: #0b0b0b;
    border: none;
    border-radius: 10px;
    padding: 10px 16px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;

    &:hover {
      background: #b69733;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  @media (max-width: 700px) {
    position: static; /* allow wrapping on small screens */
    transform: none;
    margin-left: 0;
    margin-top: 8px;
    justify-content: center;
  }

  @media (min-width: 1200px) {
    transform: translateY(-50%) translateX(160px); /* slightly less push on very wide screens */
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
  flex-wrap: wrap;
  gap: 6px;

  &:hover {
    background: ${({ pinned }) => (pinned ? "#b69733" : "#2a2a2a")};
  }

  div {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    strong {
      color: ${({ pinned }) => (pinned ? "#0b0b0b" : "#a8892a")};
      font-size: 1rem;
    }

    .desc {
      font-weight: 400;
      color: ${({ pinned }) => (pinned ? "#222" : "#ddd")};
      font-size: 0.9rem;
    }
  }

  span:last-child {
    font-size: 0.85rem;
    opacity: 0.9;
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
  padding: 16px 16px 60px;
  box-shadow: 0 0 10px rgba(168, 137, 42, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
  min-height: 360px;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 16px rgba(168, 137, 42, 0.15);
  }
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

const AliquotaBox = styled.div`
  background: rgba(168, 137, 42, 0.1);
  border: 1px solid #a8892a44;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LawButtonContainer = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 12px;
  background: linear-gradient(0deg, rgba(26,26,26,1) 60%, rgba(26,26,26,0) 100%);
`;

const LawButton = styled.a`
  background: #a8892a;
  color: #0b0b0b;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  text-decoration: none;
  transition: 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;

  &:hover {
    background: #b69733;
  }
`;

/* ======= COMPONENT ======= */
export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [items, setItems] = useState([]);
  const [pinnedCodes, setPinnedCodes] = useState([]);

  useEffect(() => {
    document.documentElement.classList.add("app-full-bleed");
    return () => document.documentElement.classList.remove("app-full-bleed");
  }, []);

  async function fetchSuggestions(value) {
    if (!value.trim()) return setSuggestions([]);
    try {
      const { data } = await api.get("/ncm/sugestoes", { params: { q: value } });
      setSuggestions(data);
      setNoResults(data.length === 0);
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    }
  }

  async function searchNcm(code) {
    setQuery(code);
    setSuggestions([]);
    setNoResults(false);
    try {
      const { data } = await api.get("/ncm", { params: { q: code } });
      const pinnedItems = items.filter((i) => pinnedCodes.includes(i.codigo));
      const combined = [...pinnedItems, ...data];
      const unique = Array.from(
        new Map(combined.map((i) => [`${i.codigo}-${i.cClasstrib}`, i])).values()
      );
      setItems(unique);
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

  async function gerarRelatorio(formato) {
    if (pinnedCodes.length === 0) {
      alert("Nenhum NCM fixado para gerar relatório.");
      return;
    }

    const params = new URLSearchParams({
      codigos: pinnedCodes.join(","),
      formato,
    });

    const url = `${api.defaults.baseURL}/relatorio?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao gerar relatório");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `relatorio_ncm.${formato}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar relatório");
    }
  }

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
          {/* 🔹 Campo de busca e botões */}
          <SearchWrapper>
            <InfoMessage>
              Digite um código ou descrição de NCM e clique na lupa para buscar.
            </InfoMessage>

            <SearchContainer>
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
                  <Search /> <strong>Buscar</strong>
                </button>
              </SearchBar>

              {pinnedCodes.length > 0 && (
                <ReportButtons>
                    <button onClick={() => gerarRelatorio("pdf")} aria-label="Gerar PDF">
                      <File size={16} style={{ marginRight: 8 }} /> PDF
                    </button>
                    <button onClick={() => gerarRelatorio("xlsx")} aria-label="Gerar Excel">
                      <FileSpreadsheet size={16} style={{ marginRight: 8 }} /> Excel
                    </button>
                    <button onClick={() => gerarRelatorio("txt")} aria-label="Gerar TXT">
                      <FileText size={16} style={{ marginRight: 8 }} /> TXT
                    </button>
                </ReportButtons>
              )}
            </SearchContainer>
          </SearchWrapper>

          {/* Sugestões */}
          {query.trim() && (
            <SuggestionBox>
              {noResults ? (
                <SuggestionItem
                  style={{
                    color: "#777",
                    textAlign: "center",
                    cursor: "default",
                    padding: "12px",
                    fontStyle: "italic",
                  }}
                >
                  Nenhum NCM encontrado
                </SuggestionItem>
              ) : (
                suggestions.map((s) => (
                  <SuggestionItem
                    key={`${s.codigo}-${s.cClasstrib}`}
                    onClick={() => searchNcm(s.codigo)}
                  >
                    {s.codigo} — {s.descricao}
                  </SuggestionItem>
                ))
              )}
            </SuggestionBox>
          )}

          {/* Resultados */}
          {Object.entries(groupedItems).map(([codigo, group]) => (
            <NcmGroup key={codigo}>
              <NcmHeader
                pinned={pinnedCodes.includes(codigo)}
                onClick={() => togglePin(codigo)}
              >
                <div>
                  <strong>{codigo}</strong>{" "}
                  <span className="desc">{group[0].descricao}</span>
                </div>
                <span>
                  {pinnedCodes.includes(codigo)
                    ? "📌 Fixado"
                    : "📍 Clique para fixar"}
                </span>
              </NcmHeader>

              <Grid>
                {group.map((item) => {
                  const { classTrib } = item;
                  if (!classTrib) return null;

                  const pRedIBS = parseFloat(classTrib.pRedIBS) || 0;
                  const pRedCBS = parseFloat(classTrib.pRedCBS) || 0;
                  const cst = classTrib.cstIbsCbs?.toString();
                  const cstZerados = ["400", "410", "510", "550", "620"];
                  const isIsento = cstZerados.includes(cst);

                  const aliquotaIBS = isIsento ? 0 : 0.1 * (1 - pRedIBS / 100);
                  const aliquotaCBS = isIsento ? 0 : 0.9 * (1 - pRedCBS / 100);

                  return (
                    <Card key={`${item.codigo}-${item.cClasstrib}`}>
                      <Section>
                        <p>
                          <strong>CST:</strong> {cst || "—"}
                        </p>
                        <p>
                          <strong>cClasTrib:</strong>{" "}
                          {classTrib.codigoClassTrib
                            ?.toString()
                            .padStart(6, "0")}
                        </p>
                        <p>
                          <strong>Descrição:</strong>{" "}
                          {classTrib.descricaoClassTrib || "—"}
                        </p>
                        <p>
                          <strong>Redução IBS/CBS:</strong>{" "}
                          {classTrib.pRedIBS}% / {classTrib.pRedCBS}%
                        </p>

                        <AliquotaBox>
                          <p>
                            <strong>Alíquota IBS:</strong>{" "}
                            {aliquotaIBS.toFixed(2)}%
                          </p>
                          <p>
                            <strong>Alíquota CBS:</strong>{" "}
                            {aliquotaCBS.toFixed(2)}%
                          </p>

                          {isIsento && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: "rgba(168,137,42,0.15)",
                                border: "1px solid #a8892a55",
                                color: "#f5f5f5",
                                fontSize: "0.85rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {(() => {
                                const cstText = {
                                  "400": "ISENÇÃO",
                                  "410": "IMUNIDADE / NÃO INCIDÊNCIA",
                                  "510": "DIFERIMENTO",
                                  "550": "SUSPENSÃO",
                                  "620": "TRIBUTAÇÃO MONOFÁSICA",
                                }[cst];
                                return `${cstText || "Tratamento Tributário Específico"}`;
                              })()}
                            </div>
                          )}
                        </AliquotaBox>

                        <LawButtonContainer>
                          <LawButton
                            href={classTrib.link || "#"}
                            target={classTrib.link ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            style={{
                              opacity: classTrib.link ? 1 : 0.5,
                              cursor: classTrib.link
                                ? "pointer"
                                : "not-allowed",
                            }}
                          >
                            <BookOpen
                              size={18}
                              color="#0b0b0b"
                              strokeWidth={2}
                            />
                            Base Legal - LC 214/25
                          </LawButton>
                        </LawButtonContainer>
                      </Section>
                    </Card>
                  );
                })}
              </Grid>
            </NcmGroup>
          ))}
        </Content>
      </Layout>
    </>
  );
}
