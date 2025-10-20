import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import debounce from "lodash.debounce";
import { api } from "../api/http";

// === estilos ===
const Container = styled.div`
  background-color: #0b0b0b;
  color: #f5f5f5;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  padding: 40px 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  h1 {
    color: #a8892a;
    font-size: 1.8rem;
    letter-spacing: 1px;
  }

  button {
    background: transparent;
    border: 1px solid #a8892a;
    color: #a8892a;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;

    &:hover {
      background: #a8892a;
      color: #0b0b0b;
    }
  }
`;

const SearchBar = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  gap: 10px;

  input {
    width: 100%;
    max-width: 500px;
    padding: 12px 16px;
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

const Checkbox = styled.input`
  position: absolute;
  top: 16px;
  right: 16px;
  accent-color: #a8892a;
  width: 20px;
  height: 20px;
  cursor: pointer;
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

const Footer = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: center;

  button {
    background: #a8892a;
    color: #0b0b0b;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
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
`;

const LoadingText = styled.p`
  text-align: center;
  color: #a8892a;
  margin-top: 40px;
  font-weight: 500;
`;

// === componente funcional ===
export default function Dashboard() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // === função para buscar NCMs ===
  const fetchNcm = async (query) => {
    setLoading(true);
    try {
      const { data } = await api.get("/ncm", { params: { q: query } });
      setItems(data);
    } catch (err) {
      console.error("Erro ao buscar NCM:", err);
    } finally {
      setLoading(false);
    }
  };

  // === debounce para evitar requisições em excesso ===
  const debouncedSearch = useCallback(debounce(fetchNcm, 400), []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQ(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    fetchNcm(""); // carrega inicial
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const gerarRelatorio = () => {
    alert(`Gerar relatório para ${selected.length} NCM(s) selecionados.`);
  };

  return (
    <Container>
      <Header>
        <h1>Parametrizze</h1>
        <button onClick={logout}>Sair</button>
      </Header>

      <SearchBar>
        <input
          placeholder="Buscar por código ou descrição do NCM..."
          value={q}
          onChange={handleChange}
        />
      </SearchBar>

      {loading && <LoadingText>Carregando resultados...</LoadingText>}

      <Grid>
        {!loading &&
          items.map((item) => (
            <Card key={`${item.codigo}-${item.cClasstrib}`}>
              <Checkbox
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggleSelect(item.id)}
              />

              <NcmCode>{item.codigo}</NcmCode>
              <NcmDesc>{item.descricao}</NcmDesc>

              {item.classTrib && (
                <Section>
                  <strong>Classificação Tributária</strong>
                  <p>
                    <strong>Código:</strong> {item.classTrib.codigoClassTrib}
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

      {items.length > 0 && !loading && (
        <Footer>
          <button disabled={!selected.length} onClick={gerarRelatorio}>
            Gerar Relatório ({selected.length})
          </button>
        </Footer>
      )}
    </Container>
  );
}
