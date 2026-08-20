-- Master Observer: broad business visibility, no write grants.
-- Clinical records, conversation message bodies, secrets, vaults and credentials remain protected.

drop policy if exists companies_master_observer_read on public.companies;
create policy companies_master_observer_read on public.companies for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists billing_contracts_master_observer_read on public.billing_contracts;
create policy billing_contracts_master_observer_read on public.billing_contracts for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists billing_invoices_master_observer_read on public.billing_invoices;
create policy billing_invoices_master_observer_read on public.billing_invoices for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists crm_opportunities_master_observer_read on public.crm_opportunities;
create policy crm_opportunities_master_observer_read on public.crm_opportunities for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists crm_pipelines_master_observer_read on public.crm_pipelines;
create policy crm_pipelines_master_observer_read on public.crm_pipelines for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists crm_pipeline_stages_master_observer_read on public.crm_pipeline_stages;
create policy crm_pipeline_stages_master_observer_read on public.crm_pipeline_stages for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists communication_contacts_master_observer_read on public.communication_contacts;
create policy communication_contacts_master_observer_read on public.communication_contacts for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists n8n_workflow_registry_master_observer_read on public.n8n_workflow_registry;
create policy n8n_workflow_registry_master_observer_read on public.n8n_workflow_registry for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists core_financial_documents_master_observer_read on public.core_financial_documents;
create policy core_financial_documents_master_observer_read on public.core_financial_documents for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists core_suppliers_master_observer_read on public.core_suppliers;
create policy core_suppliers_master_observer_read on public.core_suppliers for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists sales_orders_master_observer_read on public.sales_orders;
create policy sales_orders_master_observer_read on public.sales_orders for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));

drop policy if exists sales_order_items_master_observer_read on public.sales_order_items;
create policy sales_order_items_master_observer_read on public.sales_order_items for select to authenticated using (public.is_impulsionando_master_observer(auth.uid()));
