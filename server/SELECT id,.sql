SELECT id,
       code,
       po_company_id,
       pp_company_id,
       work_area_id,
       start_date,
       end_date,
       status,
       city_id,
       project_total_price,
       complete_rate,
       created_at,
       updated_at,
       created_by,
       updated_by,
       is_active
FROM public.projects
LIMIT 1000;

update projects set status='active'