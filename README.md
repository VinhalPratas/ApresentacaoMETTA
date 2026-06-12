# Metta Faturamento

Prototipo funcional em HTML, CSS e JavaScript para controle do ciclo de faturamento de clinicas de imagem.

## Como abrir

Abra o arquivo `index.html` no navegador.

## Modulos incluidos

- Dashboard inteligente com indicadores financeiros, taxa de glosa, ranking critico e grafico mensal.
- Estatisticas separando valor original/faturado, valor recebido, valor glosado, valor em recurso e valor recuperado.
- Filtros por mes e convenio no dashboard.
- Resumo por mes e convenio.
- Cadastro de faturamento com guia, paciente, convenio, exame, valor original/faturado, valor recebido, responsavel e status.
- Controle de glosas com motivo, valor glosado, data, responsavel e prazo de recurso.
- Status do processo da glosa: aberta, em analise, recurso enviado, deferida, indeferida e recuperada.
- Area "Como usar" com cards explicativos para apresentacao inicial do sistema.
- Radar de Glosa com analise preventiva por pendencias documentais e historico do convenio.
- Ranking de convenios por faturado, glosado e percentual de glosa.
- Central de recursos com carta, justificativa, anexos necessarios e alertas de prazo.
- Indicadores para diretoria com perda, recuperacao, convenio problematico e performance.
- Tela de dossie da guia reunindo autorizacao, pedido medico, laudo, imagens e faturamento.
- Backup JSON para guardar os dados fora do navegador.
- Importacao de backup JSON.
- Relatorio em Excel no formato `.xls`.

## Banco de dados

O arquivo `schema.sql` contem a estrutura sugerida com:

- pacientes
- convenios
- exames
- guias
- faturamento
- recebimentos
- glosas
- recursos
- usuarios
- auditoria

## Observacao

Os dados sao salvos automaticamente no `localStorage` do navegador. O botao de recarregar no topo restaura a base minima com uma guia teste.
