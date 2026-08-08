DO $$
DECLARE
  v_company record; v_unit_id uuid; v_existing int;
  v_first_names text[] := ARRAY['Ana','Bruno','Carla','Diego','Eduarda','Felipe','Gabriela','Henrique','Isabela','João','Karina','Lucas','Mariana','Nicolas','Olivia','Pedro','Quesia','Rafael','Sofia','Thiago','Ursula','Vinicius','Wesley','Ximena','Yasmin','Ze','Aline','Bernardo','Camila','Daniel','Elaine','Fabio','Giovana','Hugo','Iara','Julio','Katia','Leonardo','Marina','Nathalia'];
  v_last_names text[] := ARRAY['Silva','Souza','Oliveira','Santos','Pereira','Costa','Almeida','Rodrigues','Lima','Gomes','Ferreira','Carvalho','Ribeiro','Martins','Rocha','Mendes','Barbosa','Araujo','Cardoso','Teixeira','Moreira','Nascimento','Vieira','Castro','Cunha','Pinto','Moraes','Andrade','Freitas','Macedo'];
  v_cities text[] := ARRAY['São Paulo','Campinas','Santos','Ribeirão Preto','Sorocaba','São José dos Campos','Bauru','Piracicaba','Jundiaí','Limeira'];
  v_tags_pool text[] := ARRAY['vip','recorrente','novo','indicacao','online','presencial','aniversariante','inadimplente','premium'];
  v_supplier_names text[] := ARRAY['Distribuidora Central','Atacado Nordeste','Fornecedora Prime','Industria São Paulo','Logistica Express','Comercial Bandeirantes','Importadora Aurora','Distribuidora Sul','Atacado Mineiro','Casa do Atacado','MegaSupply','Conexao B2B','Distribuicao Direta','Atacado Premium','Casa Forte Atacado','Distribuidor Capital','Hub Suprimentos','Distribuidora Vale','Atacado Brasil','Conecta Atacado','Distribuidora Lider','Premium Distribution','Atacado Estrela','Hub Comercial','Fornece Ja'];
  v_genders text[] := ARRAY['female','male','female','male','other'];
  v_prof_colors text[] := ARRAY['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
  v_svc_colors text[] := ARRAY['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
  v_svc_durations int[] := ARRAY[30,45,60,15,90,30,60,45];
  v_stage_names text[] := ARRAY['Novo lead','Qualificacao','Proposta','Negociacao','Fechado'];
  v_stage_colors text[] := ARRAY['#6b7280','#3b82f6','#f59e0b','#8b5cf6','#10b981'];
  v_appt_statuses text[] := ARRAY['completed','completed','completed','no_show','cancelled'];
  v_order_statuses text[] := ARRAY['confirmed','confirmed','confirmed','confirmed','cancelled'];
  v_lead_statuses text[] := ARRAY['new','working','qualified','disqualified','converted'];
  v_sources text[] := ARRAY['site','whatsapp','indicacao','instagram','google'];
  v_ehr_complaints text[] := ARRAY['Cefaleia recorrente','Dor lombar','Acompanhamento hipertensao','Consulta de rotina','Dor abdominal','Acompanhamento diabetes','Avaliacao cardiologica','Tontura recorrente','Insonia','Ansiedade'];
  v_prop_types_label text[] := ARRAY['Apartamento ','Casa ','Cobertura ','Studio ','Sobrado '];
  v_prop_types_code text[] := ARRAY['apartamento','casa','cobertura','studio','outro'];
  v_neighborhoods text[] := ARRAY['Centro','Jardins','Vila Nova','Bela Vista','Pinheiros','Moema'];
  v_prod_saude text[] := ARRAY['Dipirona 500mg','Soro Fisiologico 500ml','Curativo Esteril','Luvas Procedimento','Mascara Cirurgica','Termometro Digital','Estetoscopio','Esfigmomanometro','Seringa 5ml','Gaze Esteril'];
  v_prod_bares text[] := ARRAY['Chopp Pilsen 300ml','Hamburguer Artesanal','Porcao Batata Frita','Drink Caipirinha','Refrigerante 350ml','Agua Mineral','Suco Natural','Petisco Mix','Pizza Individual','Sobremesa do Dia'];
  v_prod_cerv text[] := ARRAY['IPA Garrafa 500ml','Pilsen Long Neck','Witbier Lata','Stout Garrafa','Lager Premium','APA Limitada','Sour Frutada','Porter Cafe','Weiss Tradicional','Belgian Strong'];
  v_prod_varejo text[] := ARRAY['Camiseta Premium','Caneca Personalizada','Tenis Esportivo','Mochila Reforcada','Caderno Capa Dura','Caneta Profissional','Mouse Sem Fio','Teclado Mecanico','Cabo USB-C','Carregador Rapido'];
  v_svc_saude text[] := ARRAY['Consulta Clinica','Retorno','Exame Cardiologico','Curativo','Aplicacao','Avaliacao Inicial','Procedimento Estetico','Consulta Online'];
  v_svc_bares text[] := ARRAY['Reserva Mesa 4','Reserva Mesa 8','Pacote Aniversario','Karaoke 1h','Mesa VIP','Confraternizacao','Happy Hour','Open Bar 2h'];
  v_svc_imob text[] := ARRAY['Visita Apartamento','Visita Casa','Avaliacao Imovel','Assinatura Contrato','Vistoria Entrega','Vistoria Saida','Reuniao Proprietario','Reuniao Investidor'];
  v_svc_default text[] := ARRAY['Atendimento Padrao','Atendimento Premium','Consultoria 30min','Consultoria 1h','Reuniao Diagnostica','Apresentacao Comercial','Onboarding','Suporte Avancado'];
  v_i int; v_j int;
  v_customer_id uuid; v_customer_ids uuid[];
  v_supplier_ids uuid[]; v_product_ids uuid[];
  v_professional_ids uuid[]; v_service_ids uuid[];
  v_pipeline_id uuid;
  v_account_id uuid; v_cat_in uuid; v_cat_out uuid;
  v_record_id uuid; v_order_id uuid;
  v_qty int; v_unit_price numeric; v_starts timestamptz;
  v_status text; v_full_name text; v_doc text; v_phone text; v_email text;
  v_prod_name text; v_svc_name text;
BEGIN
  FOR v_company IN
    SELECT id, name, niche_id,
      (SELECT slug FROM public.niches WHERE id = c.niche_id) AS niche_slug
    FROM public.companies c WHERE is_demo = true
  LOOP
    SELECT count(*) INTO v_existing FROM public.customers WHERE company_id = v_company.id;
    IF v_existing > 0 THEN CONTINUE; END IF;

    INSERT INTO public.company_units (company_id, name, code, city, state, is_active)
    VALUES (v_company.id, 'Matriz', 'MATRIZ', v_cities[1], 'SP', true)
    RETURNING id INTO v_unit_id;

    v_customer_ids := ARRAY[]::uuid[];
    FOR v_i IN 1..40 LOOP
      v_full_name := v_first_names[1 + (v_i % array_length(v_first_names,1))]
        || ' ' || v_last_names[1 + ((v_i * 7) % array_length(v_last_names,1))];
      v_doc := lpad((100000000 + v_i * 137)::text, 11, '0');
      v_phone := '(11) 9' || lpad((10000000 + v_i * 9173)::text, 8, '0');
      v_email := lower(regexp_replace(v_full_name, '\s+', '.', 'g')) || v_i || '@demo.impulsionando.com.br';
      INSERT INTO public.customers (company_id, unit_id, name, email, phone, document, birthdate, gender, address_line, address_city, address_state, address_zip, tags, notes, is_active)
      VALUES (v_company.id, v_unit_id, v_full_name, v_email, v_phone, v_doc,
        (current_date - ((20 + (v_i*7) % 50) * 365)::int)::date,
        v_genders[1 + (v_i % 5)],
        'Rua ' || v_last_names[1 + (v_i % 30)] || ', ' || (100 + v_i * 13),
        v_cities[1 + (v_i % array_length(v_cities,1))], 'SP',
        lpad(((1000000 + v_i * 991) % 99999999)::text, 8, '0'),
        ARRAY[v_tags_pool[1 + (v_i % array_length(v_tags_pool,1))]],
        'Cliente demo seed', true)
      RETURNING id INTO v_customer_id;
      v_customer_ids := array_append(v_customer_ids, v_customer_id);
    END LOOP;

    v_supplier_ids := ARRAY[]::uuid[];
    FOR v_i IN 1..25 LOOP
      INSERT INTO public.inv_suppliers (company_id, name, legal_name, document, email, phone, is_active)
      VALUES (v_company.id, v_supplier_names[v_i], v_supplier_names[v_i] || ' LTDA',
        lpad((10000000000000 + v_i * 1373)::text, 14, '0'),
        'contato' || v_i || '@fornecedor' || v_i || '.com.br',
        '(11) 3' || lpad((1000000 + v_i * 7919)::text, 7, '0'), true)
      RETURNING id INTO v_customer_id;
      v_supplier_ids := array_append(v_supplier_ids, v_customer_id);
    END LOOP;

    v_product_ids := ARRAY[]::uuid[];
    FOR v_i IN 1..80 LOOP
      v_prod_name := CASE v_company.niche_slug
        WHEN 'saude' THEN v_prod_saude[1 + (v_i % 10)]
        WHEN 'bares' THEN v_prod_bares[1 + (v_i % 10)]
        WHEN 'cervejarias' THEN v_prod_cerv[1 + (v_i % 10)]
        WHEN 'imobiliaria' THEN 'Servico imobiliario'
        ELSE v_prod_varejo[1 + (v_i % 10)]
      END || ' #' || v_i;
      INSERT INTO public.inv_products (company_id, supplier_id, sku, name, unit, cost_price, sale_price, current_stock, min_stock, track_stock, is_active)
      VALUES (v_company.id, v_supplier_ids[1 + (v_i % 25)],
        'SKU-' || lpad(v_i::text, 4, '0'), v_prod_name, 'UN',
        round((5 + (v_i * 17) % 200)::numeric, 2),
        round((10 + (v_i * 23) % 400)::numeric, 2),
        50 + (v_i * 11) % 200, 10, true, true)
      RETURNING id INTO v_customer_id;
      v_product_ids := array_append(v_product_ids, v_customer_id);
    END LOOP;

    v_professional_ids := ARRAY[]::uuid[];
    FOR v_i IN 1..6 LOOP
      INSERT INTO public.agenda_professionals (company_id, unit_id, name, email, phone, color, commission_pct, is_active)
      VALUES (v_company.id, v_unit_id,
        CASE v_company.niche_slug WHEN 'saude' THEN 'Dr(a). ' ELSE '' END
          || v_first_names[v_i] || ' ' || v_last_names[v_i],
        'prof' || v_i || '@demo.impulsionando.com.br',
        '(11) 9' || lpad((90000000 + v_i * 311)::text, 8, '0'),
        v_prof_colors[v_i], 10 + v_i * 2, true)
      RETURNING id INTO v_customer_id;
      v_professional_ids := array_append(v_professional_ids, v_customer_id);
    END LOOP;

    v_service_ids := ARRAY[]::uuid[];
    FOR v_i IN 1..8 LOOP
      v_svc_name := CASE v_company.niche_slug
        WHEN 'saude' THEN v_svc_saude[v_i]
        WHEN 'bares' THEN v_svc_bares[v_i]
        WHEN 'imobiliaria' THEN v_svc_imob[v_i]
        ELSE v_svc_default[v_i]
      END;
      INSERT INTO public.agenda_services (company_id, name, description, duration_min, price, color, is_active)
      VALUES (v_company.id, v_svc_name, 'Servico gerado para demonstracao',
        v_svc_durations[v_i], round((50 + v_i * 47)::numeric, 2), v_svc_colors[v_i], true)
      RETURNING id INTO v_customer_id;
      v_service_ids := array_append(v_service_ids, v_customer_id);
    END LOOP;

    FOR v_i IN 1..80 LOOP
      v_starts := now() + ((v_i - 60) || ' days')::interval + (((v_i * 17) % 9) || ' hours')::interval;
      v_status := CASE WHEN v_starts < now() - interval '1 day' THEN v_appt_statuses[1 + (v_i % 5)] ELSE 'scheduled' END;
      INSERT INTO public.agenda_appointments (company_id, unit_id, professional_id, service_id, customer_id, customer_name, customer_phone, customer_email, starts_at, ends_at, status, price, notes)
      SELECT v_company.id, v_unit_id, v_professional_ids[1 + (v_i % 6)],
        v_service_ids[1 + (v_i % 8)], v_customer_ids[1 + (v_i % 40)],
        c.name, c.phone, c.email, v_starts, v_starts + interval '45 minutes',
        v_status, round((50 + (v_i * 13) % 300)::numeric, 2), 'Agendamento demo'
      FROM public.customers c WHERE c.id = v_customer_ids[1 + (v_i % 40)];
    END LOOP;

    INSERT INTO public.crm_pipelines (company_id, name, is_default, sort_order, is_active)
    VALUES (v_company.id, 'Funil Comercial', true, 0, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_pipeline_id;
    IF v_pipeline_id IS NULL THEN
      SELECT id INTO v_pipeline_id FROM public.crm_pipelines WHERE company_id = v_company.id AND name = 'Funil Comercial' LIMIT 1;
    END IF;

    FOR v_i IN 1..5 LOOP
      INSERT INTO public.crm_stages (company_id, pipeline_id, name, color, sort_order, stage_type, win_probability)
      VALUES (v_company.id, v_pipeline_id, v_stage_names[v_i], v_stage_colors[v_i],
        v_i, CASE v_i WHEN 5 THEN 'won' ELSE 'open' END, v_i * 20)
      ON CONFLICT DO NOTHING;
    END LOOP;

    FOR v_i IN 1..40 LOOP
      v_full_name := v_first_names[1 + ((v_i*3) % array_length(v_first_names,1))]
        || ' ' || v_last_names[1 + ((v_i*5) % array_length(v_last_names,1))];
      INSERT INTO public.crm_leads (company_id, unit_id, name, email, phone, source, score, status, notes)
      VALUES (v_company.id, v_unit_id, v_full_name,
        'lead' || v_i || '@demo.impulsionando.com.br',
        '(11) 9' || lpad((80000000 + v_i * 7331)::text, 8, '0'),
        v_sources[1 + (v_i % 5)], 20 + (v_i * 7) % 80,
        v_lead_statuses[1 + (v_i % 5)],
        'Lead demo gerado para demonstracao');
    END LOOP;

    INSERT INTO public.fin_accounts (company_id, name, type, opening_balance, current_balance, is_active)
    VALUES (v_company.id, 'Conta Principal Demo', 'bank', 0, 25000, true)
    RETURNING id INTO v_account_id;

    INSERT INTO public.fin_categories (company_id, name, kind, color, is_active)
    VALUES (v_company.id, 'Vendas', 'income', '#10b981', true)
    ON CONFLICT (company_id, name, kind) DO UPDATE SET is_active = true
    RETURNING id INTO v_cat_in;

    INSERT INTO public.fin_categories (company_id, name, kind, color, is_active)
    VALUES (v_company.id, 'Fornecedores', 'expense', '#ef4444', true)
    ON CONFLICT (company_id, name, kind) DO UPDATE SET is_active = true
    RETURNING id INTO v_cat_out;

    INSERT INTO public.fin_categories (company_id, name, kind, color, is_active)
    VALUES (v_company.id, 'Folha de Pagamento', 'expense', '#f59e0b', true)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.fin_categories (company_id, name, kind, color, is_active)
    VALUES (v_company.id, 'Marketing', 'expense', '#8b5cf6', true)
    ON CONFLICT DO NOTHING;

    FOR v_i IN 1..150 LOOP
      INSERT INTO public.fin_transactions (company_id, unit_id, account_id, category_id, kind, status, description, amount, due_date, paid_at, customer_name)
      VALUES (v_company.id, v_unit_id, v_account_id,
        CASE WHEN v_i % 3 = 0 THEN v_cat_out ELSE v_cat_in END,
        CASE WHEN v_i % 3 = 0 THEN 'expense' ELSE 'income' END, 'paid',
        CASE WHEN v_i % 3 = 0 THEN 'Pagamento fornecedor #' ELSE 'Recebimento venda #' END || v_i,
        round((100 + (v_i * 71) % 2000)::numeric, 2),
        (current_date - ((v_i % 90))::int)::date,
        (current_date - ((v_i % 90))::int)::date, NULL);
    END LOOP;

    FOR v_i IN 1..120 LOOP
      INSERT INTO public.sales_orders (company_id, unit_id, status, customer_id, customer_name, subtotal, discount, total, confirmed_at)
      SELECT v_company.id, v_unit_id,
        v_order_statuses[1 + (v_i % 5)], v_customer_ids[1 + (v_i % 40)], c.name,
        0, 0, 0, now() - ((v_i % 90) || ' days')::interval
      FROM public.customers c WHERE c.id = v_customer_ids[1 + (v_i % 40)]
      RETURNING id INTO v_order_id;

      FOR v_j IN 1..(1 + v_i % 3) LOOP
        v_qty := 1 + (v_j * v_i) % 5;
        v_unit_price := round((20 + (v_i * v_j * 13) % 200)::numeric, 2);
        INSERT INTO public.sales_order_items (order_id, company_id, product_id, description, quantity, unit_price, discount, total)
        SELECT v_order_id, v_company.id, p.id, p.name,
          v_qty, v_unit_price, 0, v_qty * v_unit_price
        FROM public.inv_products p WHERE p.id = v_product_ids[1 + ((v_i * v_j) % 80)];
      END LOOP;

      UPDATE public.sales_orders SET
        subtotal = (SELECT coalesce(sum(total),0) FROM public.sales_order_items WHERE order_id = v_order_id),
        total = (SELECT coalesce(sum(total),0) FROM public.sales_order_items WHERE order_id = v_order_id)
      WHERE id = v_order_id;
    END LOOP;

    IF v_company.niche_slug = 'saude' THEN
      FOR v_i IN 1..15 LOOP
        INSERT INTO public.ehr_records (company_id, unit_id, customer_id, record_number, status, chief_complaint, medical_history, allergies, current_medications)
        VALUES (v_company.id, v_unit_id, v_customer_ids[v_i],
          'PRT-' || lpad(v_i::text, 5, '0'), 'active',
          v_ehr_complaints[1 + (v_i % 10)],
          'Sem comorbidades relevantes informadas.',
          'Nega alergias conhecidas.',
          CASE WHEN v_i % 3 = 0 THEN 'Losartana 50mg 1x/dia' ELSE 'Nenhuma' END)
        RETURNING id INTO v_record_id;

        FOR v_j IN 1..3 LOOP
          INSERT INTO public.ehr_evolutions (company_id, record_id, doctor_name, occurred_at, chief_complaint, clinical_history, physical_exam, hypothesis, conduct, prescription, notes, released_to_patient)
          VALUES (v_company.id, v_record_id,
            'Dr(a). ' || v_first_names[v_j] || ' ' || v_last_names[v_j],
            now() - ((v_j * 30) || ' days')::interval,
            'Retorno acompanhamento',
            'Paciente refere melhora dos sintomas.',
            'BEG, corado, hidratado. PA 120x80 mmHg. FC 72bpm.',
            'Quadro em remissao.',
            'Manter conduta. Reavaliar em 30 dias.',
            'Manter medicacao anterior.', 'Demo seed', true);
        END LOOP;
      END LOOP;
    END IF;

    IF v_company.niche_slug = 'imobiliaria' THEN
      FOR v_i IN 1..20 LOOP
        INSERT INTO public.realestate_properties (company_id, reference_code, title, description, operation, property_type, status, sale_price, rent_price, condo_fee, iptu, area_total, area_useful, bedrooms, suites, bathrooms, parking_spots, address_line, neighborhood, city, state, zip, features, is_published, approval_status)
        VALUES (v_company.id, 'REF-' || lpad(v_i::text, 5, '0'),
          v_prop_types_label[1 + (v_i % 5)] || (1 + v_i % 4) || ' dormitorios '
            || v_cities[1 + (v_i % array_length(v_cities,1))],
          'Imovel demo Impulsionando com excelente localizacao e acabamento.',
          (CASE WHEN v_i % 3 = 0 THEN 'locacao' ELSE 'venda' END)::public.realestate_operation,
          v_prop_types_code[1 + (v_i % 5)]::public.realestate_property_type,
          'ativo'::public.realestate_property_status,
          CASE WHEN v_i % 3 = 0 THEN NULL ELSE round((300000 + v_i * 47000)::numeric, 2) END,
          CASE WHEN v_i % 3 = 0 THEN round((1500 + v_i * 220)::numeric, 2) ELSE NULL END,
          round((400 + v_i * 35)::numeric, 2), round((150 + v_i * 18)::numeric, 2),
          80 + v_i * 7, 60 + v_i * 6,
          1 + v_i % 4, v_i % 3, 1 + v_i % 3, 1 + v_i % 2,
          'Rua ' || v_last_names[1 + (v_i % 30)] || ', ' || (200 + v_i * 17),
          v_neighborhoods[1 + (v_i % 6)],
          v_cities[1 + (v_i % array_length(v_cities,1))], 'SP',
          lpad(((1000000 + v_i * 991) % 99999999)::text, 8, '0'),
          '["piscina","academia","salao de festas","playground"]'::jsonb,
          true, 'approved'::public.realestate_approval_status);
      END LOOP;
    END IF;
  END LOOP;
END $$;