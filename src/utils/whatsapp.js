/**
 * Normaliza um número de WhatsApp para o formato aceito pela API wa.me.
 * Remove caracteres não numéricos e garante o prefixo '55'.
 * 
 * @param {string} number - O número de telefone original.
 * @returns {string} - O número formatado (ex: 5511988541006).
 */
export const formatarNumeroWhats = (number) => {
    if (!number) return '';

    // Remove tudo que não é número
    let cleanNumber = number.toString().replace(/\D/g, '');

    // Se o número tiver 10 ou 11 dígitos (sem DDI), adiciona 55
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
        cleanNumber = '55' + cleanNumber;
    }

    // Fallback: se o número já começar com 55 e tiver mais de 11 dígitos, mantém
    // Caso contrário, garante que retorne apenas os números

    return cleanNumber;
};
