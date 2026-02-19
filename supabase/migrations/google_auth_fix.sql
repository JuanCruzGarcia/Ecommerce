-- 1. Función que maneja la creación automática del perfil público
-- CORREGIDA: Se eliminó 'avatar_url' que no existe en tu tabla
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'customer' -- Asignamos rol 'customer' por defecto
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Crear el Trigger en la tabla auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Retroactivo: Crear perfiles para usuarios que ya existen
-- CORREGIDA: Se eliminó 'avatar_url'
insert into public.profiles (id, full_name, role)
select 
  id, 
  raw_user_meta_data->>'full_name', 
  'customer'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
