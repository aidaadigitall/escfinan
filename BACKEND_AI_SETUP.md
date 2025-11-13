# Configuração do Backend para Assistente de IA com Créditos

## 📋 Visão Geral

Este documento descreve como implementar o backend para o assistente de IA com sistema de créditos. O backend é responsável por:

1. Chamar a OpenAI com segurança (chave privada)
2. Gerenciar créditos dos usuários
3. Registrar uso e custos
4. Proteger contra abuso

## 🚀 Pré-requisitos

- Node.js 18+
- Express.js
- PostgreSQL (ou banco de dados compatível)
- Chave de API da OpenAI
- Stripe (para pagamentos - opcional)

## 📦 Instalação

### 1. Instalar Dependências

```bash
npm install openai express cors dotenv pg stripe
npm install -D @types/express @types/node
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env`:

```env
# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/escfinan

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Servidor
PORT=3001
NODE_ENV=production
```

### 3. Criar Tabelas no Banco de Dados

```sql
-- Tabela de créditos de IA
CREATE TABLE user_ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_credits INT DEFAULT 0,
  used_credits INT DEFAULT 0,
  plan_type VARCHAR(50) DEFAULT 'free',
  renewal_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de uso de IA
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_used INT NOT NULL,
  tokens_used INT NOT NULL,
  cost_usd DECIMAL(10, 4),
  request_type VARCHAR(50),
  request_content TEXT,
  response_content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_ai_credits_user_id ON user_ai_credits(user_id);
CREATE INDEX idx_ai_usage_log_user_id ON ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(created_at);
```

## 🔧 Implementação do Backend

### 1. Criar Arquivo de Rotas (`src/routes/ai.ts`)

```typescript
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkAICredits } from '../middleware/checkAICredits';
import { handleAIAssistantRequest, handleGenerateInsights } from '../server/handlers/aiAssistantHandler';

const router = express.Router();

// Middleware de autenticação
router.use(authenticateToken);

// POST /api/ai-assistant - Chamar assistente de IA
router.post('/ai-assistant', checkAICredits, async (req, res) => {
  try {
    const { message, systemData, conversationHistory } = req.body;
    const userId = req.user.id;
    const userCredits = req.userCredits;

    const response = await handleAIAssistantRequest(
      { message, systemData, conversationHistory },
      userId,
      userCredits
    );

    // Deduzir créditos
    await db.query(
      `UPDATE user_ai_credits 
       SET used_credits = used_credits + $1 
       WHERE user_id = $2`,
      [response.creditsUsed, userId]
    );

    // Registrar uso
    await db.query(
      `INSERT INTO ai_usage_log 
       (user_id, credits_used, tokens_used, cost_usd, request_type, request_content) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        response.creditsUsed,
        response.tokensUsed,
        (response.tokensUsed / 1000) * 0.03,
        response.type,
        message
      ]
    );

    res.json({
      ...response,
      creditsRemaining: userCredits.available_credits - response.creditsUsed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/ai-insights - Gerar insights
router.post('/ai-insights', checkAICredits, async (req, res) => {
  try {
    const { analysis } = req.body;
    const userId = req.user.id;
    const userCredits = req.userCredits;

    const result = await handleGenerateInsights(analysis, userId, userCredits);

    // Deduzir créditos
    await db.query(
      `UPDATE user_ai_credits 
       SET used_credits = used_credits + $1 
       WHERE user_id = $2`,
      [result.creditsUsed, userId]
    );

    res.json({
      insights: result.insights,
      creditsUsed: result.creditsUsed,
      creditsRemaining: userCredits.available_credits - result.creditsUsed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/user/ai-credits - Buscar créditos do usuário
router.get('/user/ai-credits', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT 
        total_credits,
        used_credits,
        (total_credits - used_credits) as available_credits,
        plan_type,
        renewal_date
       FROM user_ai_credits 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        total_credits: 0,
        available_credits: 0,
        plan_type: 'free'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 2. Criar Middleware de Verificação de Créditos

```typescript
// src/middleware/checkAICredits.ts
import { db } from '../database';

export const checkAICredits = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        total_credits,
        used_credits,
        (total_credits - used_credits) as available_credits
       FROM user_ai_credits 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(402).json({
        error: 'Sem créditos',
        message: 'Você não tem créditos de IA. Adquira um plano.',
        available_credits: 0
      });
    }

    const userCredits = result.rows[0];

    if (userCredits.available_credits < 10) {
      return res.status(402).json({
        error: 'Créditos insuficientes',
        message: `Você tem apenas ${userCredits.available_credits} créditos.`,
        available_credits: userCredits.available_credits
      });
    }

    req.userCredits = userCredits;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. Integrar Rotas no App Principal

```typescript
// src/server.ts
import express from 'express';
import aiRoutes from './routes/ai';

const app = express();

app.use(express.json());
app.use('/api', aiRoutes);

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
```

## 💳 Sistema de Pagamento (Stripe)

### Criar Endpoint de Checkout

```typescript
// src/routes/billing.ts
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    const plans = {
      starter: { price: 2900, credits: 5000 },
      professional: { price: 7900, credits: 20000 },
      enterprise: { price: 19900, credits: 100000 }
    };

    const plan = plans[planId];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Créditos de IA - ${planId}`,
              description: `${plan.credits} créditos de IA`
            },
            unit_amount: plan.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/upgrade?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/upgrade?canceled=true`,
      metadata: {
        userId,
        planId,
        credits: plan.credits
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook para confirmar pagamento
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, planId, credits } = session.metadata;

      // Adicionar créditos ao usuário
      await db.query(
        `INSERT INTO user_ai_credits (user_id, total_credits, plan_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
         total_credits = user_ai_credits.total_credits + $2`,
        [userId, credits, planId]
      );
    }

    res.json({received: true});
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
```

## 📊 Dashboard de Administração

Criar endpoints para monitorar uso:

```typescript
// GET /api/admin/ai-analytics
router.get('/admin/ai-analytics', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const stats = await db.query(`
    SELECT 
      COUNT(*) as total_requests,
      SUM(credits_used) as total_credits_used,
      SUM(cost_usd) as total_cost,
      COUNT(DISTINCT user_id) as unique_users
    FROM ai_usage_log
    WHERE DATE(created_at) = $1
  `, [today]);

  res.json(stats.rows[0]);
});
```

## 🔒 Segurança

1. **Nunca exponha a chave OpenAI no frontend**
2. **Sempre valide créditos no backend**
3. **Rate limit por usuário**
4. **Registre todos os usos**
5. **Use HTTPS em produção**

## 📝 Próximos Passos

1. Implementar autenticação JWT
2. Configurar banco de dados PostgreSQL
3. Implementar Stripe para pagamentos
4. Criar dashboard de administração
5. Configurar alertas de créditos baixos
6. Implementar auto-renovação de planos

## 🆘 Troubleshooting

**Erro: "OPENAI_API_KEY não configurada"**
- Verifique se a variável de ambiente está definida
- Reinicie o servidor após adicionar a variável

**Erro: "Créditos insuficientes"**
- Verifique se o usuário tem um plano ativo
- Confirme que o pagamento foi processado

**Erro: "Conexão com OpenAI falhou"**
- Verifique a chave de API
- Confirme que sua conta tem saldo
- Verifique limites de rate limit

---

**Dúvidas?** Consulte a documentação da OpenAI: https://platform.openai.com/docs
