DO $$
DECLARE
  v_company_id uuid;
  v_assistant jsonb;
BEGIN
  SELECT id INTO v_company_id FROM public.companies WHERE subdomain = 'riomed' LIMIT 1;
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'RioMed company not found; skipping.';
    RETURN;
  END IF;

  UPDATE public.companies
     SET phone = '+591 3 324 6171',
         website = 'https://riomed.com.bo',
         address_city = 'Santa Cruz de la Sierra',
         address_state = 'SC',
         updated_at = now()
   WHERE id = v_company_id;

  v_assistant := jsonb_build_object(
    'version', '2026-06-22',
    'language', 'es-BO',
    'source', 'Briefing oficial agência (WhatsApp Marketing Rio Med, 04/06/2025) + revisão 06/2026',
    'general_rules', jsonb_build_array(
      'Nunca enviar datos, precios o disponibilidades que no estén registrados en este prompt.',
      'Ante cualquier duda sobre un servicio o producto, orientar siempre al usuario a llamar para confirmar.',
      'Al inicio invitar al cliente a completar nombre completo, ciudad y WhatsApp.',
      'Cada público recibe únicamente la información de su categoría (Paciente / Clínica Privada / Hospital Público).',
      'Nunca desviar el flujo: si pide info fuera de su categoría, indicar amablemente que no está disponible y ofrecer llamar.',
      'Al finalizar, solicitar encuesta de satisfacción 1–5 (tiempo de atención, calidad de la respuesta, si se atendió la duda).'
    ),
    'greeting', jsonb_build_object(
      'text', '¡Bienvenido a Rio Med! 🙌  Para poder ayudarte mejor, por favor indícame a qué perfil perteneces:  1 Paciente / Cliente  2 Clínica Privada  3 Hospital Público',
      'fallback', 'Lo siento, no entendí. Por favor, selecciona una opción escribiendo 1, 2 o 3.'
    ),
    'audiences', jsonb_build_object(
      'paciente', jsonb_build_object(
        'label','Paciente / Cliente',
        'welcome','¡Perfecto, eres Paciente / Cliente! 😊 Ofrecemos productos para tu comodidad y salud. Solo verás las opciones disponibles para uso personal.',
        'catalog', jsonb_build_array(
          jsonb_build_object('name','Bomba de infusión','modalities', jsonb_build_array('alquiler')),
          jsonb_build_object('name','Silla de ruedas','modalities', jsonb_build_array('alquiler')),
          jsonb_build_object('name','Muletas','modalities', jsonb_build_array('alquiler')),
          jsonb_build_object('name','Cama eléctrica','modalities', jsonb_build_array('venta','alquiler')),
          jsonb_build_object('name','Andador / Burrito','modalities', jsonb_build_array('alquiler'))
        ),
        'collect_data', jsonb_build_array('Nombre completo','Ciudad','Número de celular (WhatsApp)'),
        'out_of_catalog','Lo siento, ese producto no está disponible para Pacientes / Clientes o no está registrado. Si tienes dudas, llama: +591 726 310 63 / +591 332 461 71',
        'price_or_stock','Disculpa, esos datos no están registrados aquí. Llama para confirmar precio y disponibilidad: +591 726 310 63 / +591 332 461 71',
        'closing','¡Gracias, [Nombre]! Un ejecutivo de Rio Med te contactará en breve para finalizar tu solicitud.'
      ),
      'clinica', jsonb_build_object(
        'label','Clínica Privada',
        'welcome','¡Entendido, eres Clínica Privada! 🏥 A continuación verás solo los equipos y servicios disponibles para clínicas.',
        'catalog', jsonb_build_array(
          jsonb_build_object('name','Bomba de infusión','modalities', jsonb_build_array('venta','alquiler')),
          jsonb_build_object('name','Monitor cardíaco','modalities', jsonb_build_array('venta','alquiler')),
          jsonb_build_object('name','Ventilador pulmonar','modalities', jsonb_build_array('venta','alquiler')),
          jsonb_build_object('name','Desfibrilador','modalities', jsonb_build_array('venta')),
          jsonb_build_object('name','Aparato de anestesia','modalities', jsonb_build_array('venta'))
        ),
        'collect_data', jsonb_build_array('Nombre del responsable','Nombre de la clínica','Ciudad','Número de celular (WhatsApp)'),
        'out_of_catalog','Ese equipo no está registrado para Clínicas Privadas. Si lo necesitas, llama: +591 726 310 63 / +591 332 461 71',
        'price_or_stock','Los detalles de precios, plazos y stock solo se confirman por teléfono: +591 726 310 63 / +591 332 461 71',
        'closing','¡Gracias, [Nombre del responsable]! Un ejecutivo de ventas especializado se pondrá en contacto contigo pronto.'
      ),
      'hospital', jsonb_build_object(
        'label','Hospital Público',
        'welcome','¡Comprendido, eres Hospital Público! 🏨 A continuación verás solo productos y servicios para instituciones hospitalarias.',
        'catalog', jsonb_build_array(
          jsonb_build_object('name','Bomba de infusión','modalities', jsonb_build_array('venta','alquiler')),
          jsonb_build_object('name','Monitor cardíaco','modalities', jsonb_build_array('venta','alquiler')),
          jsonb_build_object('name','Ventilador pulmonar','modalities', jsonb_build_array('venta','alquiler')),
          jsonb_build_object('name','Equipos de anestesia','modalities', jsonb_build_array('venta','alquiler'))
        ),
        'collect_data', jsonb_build_array('Nombre del responsable de compras','Nombre del hospital','Ciudad','Número de celular (WhatsApp)'),
        'out_of_catalog','Ese equipamiento no está disponible para Hospitales Públicos según nuestra base. Llama: +591 726 310 63 / +591 332 461 71',
        'price_or_stock','Para precios, plazos y modalidad (venta o alquiler) llama al equipo comercial: +591 726 310 63 / +591 332 461 71',
        'closing','¡Listo! Un ejecutivo de Rio Med te contactará en breve para concretar la solicitud de tu hospital.'
      )
    ),
    'rental_requirements', jsonb_build_array(
      'Fotocopia de Cédula de Identidad (CI)',
      'Factura de luz reciente',
      'Croquis de domicilio',
      'Ubicación GPS',
      'Garantía equivalente a un mes de alquiler',
      'Tres referencias personales'
    ),
    'sales_handoff_data', jsonb_build_array('Nombre completo','Ciudad','Número de celular (WhatsApp)'),
    'satisfaction_survey', jsonb_build_object(
      'scale','1 (muy insatisfecho) – 5 (muy satisfecho)',
      'questions', jsonb_build_array(
        'Tiempo hasta recibir atención',
        'Calidad de la respuesta',
        '¿Se resolvió tu duda?'
      )
    )
  );

  UPDATE public.core_tenant_identity
     SET metadata = metadata || jsonb_build_object(
       'phones', jsonb_build_array('+591 332 461 71','+591 726 310 63'),
       'whatsapp_ventas', '+59172631063',
       'sucursal', jsonb_build_object(
         'address','Alameda Junín N° 301',
         'city','Santa Cruz de la Sierra',
         'country','BO'
       ),
       'business_hours', jsonb_build_object(
         'weekdays','08:00–12:00 y 14:00–17:30',
         'days','Lunes a Viernes'
       ),
       'tienda_virtual','https://riomed.com.bo',
       'envios','Nacionales y a domicilio (con costo adicional)',
       'ai_assistant', v_assistant,
       'assistant_synced_at', to_jsonb(now())
     ),
     updated_at = now()
   WHERE company_id = v_company_id;
END $$;