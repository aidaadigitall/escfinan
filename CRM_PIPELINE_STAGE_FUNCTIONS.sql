-- ============================================================================
-- Funções RPC para manipular a tabela pipeline_stages via Supabase
-- Essas funções evitam o erro de schema cache e aplicam regras de negócio
-- ============================================================================

-- 1. Função para listar estágios do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_pipeline_stages()
RETURNS SETOF public.pipeline_stages
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.pipeline_stages
  WHERE user_id = auth.uid()
  ORDER BY order_index;
$$;

GRANT EXECUTE ON FUNCTION public.get_pipeline_stages() TO anon, authenticated, service_role;

-- 2. Função para criar estágio
CREATE OR REPLACE FUNCTION public.create_pipeline_stage(
  p_name text,
  p_description text DEFAULT NULL,
  p_color text DEFAULT '#3b82f6',
  p_order_index integer DEFAULT NULL,
  p_probability integer DEFAULT 50
)
RETURNS public.pipeline_stages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_order integer;
  v_stage public.pipeline_stages;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF p_order_index IS NULL THEN
    SELECT COALESCE(MAX(order_index) + 1, 0)
    INTO v_order
    FROM public.pipeline_stages
    WHERE user_id = v_user;
  ELSE
    v_order := p_order_index;
  END IF;

  INSERT INTO public.pipeline_stages (user_id, name, description, order_index, color, probability_default)
  VALUES (v_user, p_name, p_description, v_order, p_color, COALESCE(p_probability, 0))
  RETURNING * INTO v_stage;

  RETURN v_stage;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pipeline_stage(text, text, text, integer, integer) TO anon, authenticated, service_role;

-- 3. Função para atualizar estágio
CREATE OR REPLACE FUNCTION public.update_pipeline_stage(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_color text DEFAULT NULL,
  p_order_index integer DEFAULT NULL,
  p_probability integer DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS public.pipeline_stages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_stage public.pipeline_stages;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  UPDATE public.pipeline_stages
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    color = COALESCE(p_color, color),
    order_index = COALESCE(p_order_index, order_index),
    probability_default = COALESCE(p_probability, probability_default),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_id AND user_id = v_user
  RETURNING * INTO v_stage;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estágio não encontrado ou sem permissão';
  END IF;

  RETURN v_stage;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_pipeline_stage(uuid, text, text, text, integer, integer, boolean) TO anon, authenticated, service_role;

-- 4. Função para excluir estágio
CREATE OR REPLACE FUNCTION public.delete_pipeline_stage(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  DELETE FROM public.pipeline_stages
  WHERE id = p_id
    AND user_id = v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_pipeline_stage(uuid) TO anon, authenticated, service_role;

-- 5. Função para reordenar estágios
CREATE OR REPLACE FUNCTION public.reorder_pipeline_stages(p_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
  v_index integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  FOREACH v_id IN ARRAY p_ids LOOP
    UPDATE public.pipeline_stages
    SET order_index = v_index
    WHERE id = v_id AND user_id = v_user;
    v_index := v_index + 1;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_pipeline_stages(uuid[]) TO anon, authenticated, service_role;

-- ============================================================================
-- Fim das funções RPC
-- ============================================================================
