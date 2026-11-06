
alter table public.tracks disable trigger tracks_rules;
update public.tracks set status='approved', is_demo=true, submitted_by=null,
  featured = title in ('Noite de Luanda (Demo)','Passo Quente (Demo)','Raízes do Norte (Demo)','Palavra da Rua (Demo)');
alter table public.tracks enable trigger tracks_rules;
