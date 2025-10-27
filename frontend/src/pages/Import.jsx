export default function Import(){
  return (
    <div style={{ padding: 24 }}>
      <h2>Importar Planilha</h2>
      <p>A seguir estão as instruções para importar seus dados corretamente:</p>
      <ol>
        <li>Baixe o modelo <a href="#" title="Baixar modelo">aqui</a>.</li>
        <li>Preencha a coluna <strong>NCM</strong> com os códigos NCM correspondentes.</li>
        <li>Carregue a planilha no local indicado (área de upload nesta página).</li>
        <li>A planilha será processada e você poderá baixá-la automaticamente com os dados preenchidos.</li>
      </ol>

      <p style={{ marginTop: 18 }}><em>Observação:</em> Substitua o link do modelo pelo arquivo correto quando o template estiver disponível.</p>
    </div>
  );
}