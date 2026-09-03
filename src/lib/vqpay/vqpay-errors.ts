const ERROR_MESSAGES: Record<number, string> = {
  101: "Requisição inválida (método não permitido).",
  102: "Parâmetros não estão em JSON.",
  103: "Formato dos dados inválido.",
  104: "Encoding inválido.",
  105: "IP não autorizado.",
  106: "Whitelist de IP não configurada.",
  201: "Versão da API ausente.",
  202: "AppId ausente.",
  203: "Timestamp ausente.",
  204: "Noncestr ausente.",
  205: "Dados não podem ser vazios.",
  206: "Parâmetro obrigatório ausente.",
  207: "AppId inválido.",
  208: "Versão da API incorreta.",
  209: "Timestamp expirado.",
  210: "Requisição duplicada.",
  211: "Formato de valor monetário inválido.",
  212: "Erro de descriptografia.",
  213: "Falha na verificação da assinatura.",
  301: "Moeda não suportada.",
  302: "Comerciante não encontrado.",
  303: "Status do comerciante inválido.",
  304: "Merchant_no não corresponde ao AppId.",
  305: "Order_id duplicado.",
  306: "Método de pagamento não suportado.",
  307: "Fluxo de pagamento não suportado.",
  308: "Configuração de pagamento inválida.",
  309: "Erro na configuração do comerciante.",
  311: "Valor fora do intervalo permitido.",
  312: "Erro nos dados do pagador.",
  313: "Falha ao criar o pedido.",
  314: "Nenhum canal de pagamento disponível.",
  315: "Erro no canal de pagamento.",
  316: "Falha ao gerar checkout.",
  317: "Saldo insuficiente.",
  318: "Canal de saque indisponível.",
  401: "Falha ao consultar pedido.",
  402: "Pedido não encontrado.",
  901: "Erro interno do gateway.",
};

export function vqPayErrorMessage(code: unknown): string {
  const n = typeof code === "number" ? code : parseInt(String(code ?? ""), 10);
  if (Number.isFinite(n) && ERROR_MESSAGES[n]) return ERROR_MESSAGES[n];
  return "Erro no gateway de pagamento.";
}

export class VqPayApiError extends Error {
  readonly errorCode: number | null;
  readonly httpStatus: number;
  readonly responseBody: string;

  constructor(message: string, errorCode: number | null, httpStatus: number, responseBody: string) {
    super(message);
    this.name = "VqPayApiError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
    this.responseBody = responseBody;
  }
}
