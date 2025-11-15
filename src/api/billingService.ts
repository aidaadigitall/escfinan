// escfinan/src/api/billingService.ts

import axios from 'axios';

// URL base do seu backend (apifinanbk.escsistemas.com)
// Esta URL deve ser configurada no seu ambiente Lovable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://apifinanbk.escsistemas.com';

/**
 * Inicia o processo de checkout do Stripe.
 * @param priceId - O ID do preço do produto Stripe.
 * @param userId - O ID do usuário logado.
 * @returns A URL de redirecionamento do Stripe.
 */
export const createStripeCheckoutSession = async (priceId: string, userId: string): Promise<string> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/billing/create-checkout-session`, {
            priceId,
            userId,
        }, {
            // Adicione o token de autenticação se necessário
            // headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        // O backend retorna a URL de checkout do Stripe
        return response.data.url;
    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        // Trate o erro de forma amigável no frontend
        throw new Error('Não foi possível iniciar o pagamento. Tente novamente.');
    }
};

// Nota: O redirecionamento para a URL retornada deve ser feito no componente React/Vue/etc.
// Exemplo: window.location.href = url;
