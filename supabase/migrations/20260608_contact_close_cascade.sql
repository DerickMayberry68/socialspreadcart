-- Feature 023: Contact Close -> cascade close related quotes
-- Closing a contact ("cutting ties") closes every open quote linked to that
-- contact in a single transaction, with an interaction logged per closed quote
-- and for the contact status change. Returns the number of quotes closed.
--
-- security invoker: runs with the caller's privileges so existing RLS tenant
-- policies on contacts/quotes/interactions still apply. The explicit tenant_id
-- filter is defense-in-depth.

create or replace function public.close_contact_cascade(
  p_tenant_id uuid,
  p_contact_id uuid,
  p_previous_status text default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_closed_count integer;
begin
  -- 1. Close all non-terminal quotes for this contact and capture them.
  -- 2. Log a status_change interaction for each quote closed by the cascade.
  --    (A data-modifying CTE always runs to completion even if unreferenced.)
  with closed_quotes as (
    update public.quotes
       set status = 'closed',
           updated_at = now()
     where tenant_id = p_tenant_id
       and contact_id = p_contact_id
       and status in ('new', 'in_progress', 'booked')
    returning id
  ),
  quote_logs as (
    insert into public.interactions (tenant_id, contact_id, type, body)
    select p_tenant_id,
           p_contact_id,
           'status_change',
           'Quote closed because the contact was closed'
      from closed_quotes
    returning id
  )
  select count(*) into v_closed_count from closed_quotes;

  -- 3. Close the contact itself.
  update public.contacts
     set status = 'closed',
         updated_at = now()
   where tenant_id = p_tenant_id
     and id = p_contact_id;

  -- 4. Log the contact status change.
  insert into public.interactions (tenant_id, contact_id, type, body)
  values (
    p_tenant_id,
    p_contact_id,
    'status_change',
    case
      when p_previous_status is not null
        then 'Status changed from "' || p_previous_status || '" to "closed"'
      else 'Status changed to "closed"'
    end
  );

  return v_closed_count;
end;
$$;

revoke all on function public.close_contact_cascade(uuid, uuid, text) from public;
grant execute on function public.close_contact_cascade(uuid, uuid, text) to authenticated;
