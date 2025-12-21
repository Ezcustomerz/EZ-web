set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_creative_client_relationship_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_creative_user_id UUID;
  v_client_user_id UUID;
  v_total_spent NUMERIC;
  v_projects_count INTEGER;
BEGIN
  -- Get the creative and client user IDs from the affected booking
  IF TG_OP = 'DELETE' THEN
    v_creative_user_id := OLD.creative_user_id;
    v_client_user_id := OLD.client_user_id;
  ELSE
    v_creative_user_id := NEW.creative_user_id;
    v_client_user_id := NEW.client_user_id;
  END IF;

  -- Calculate total spent (sum of amount_paid for all bookings)
  SELECT COALESCE(SUM(amount_paid), 0)
  INTO v_total_spent
  FROM bookings
  WHERE creative_user_id = v_creative_user_id
    AND client_user_id = v_client_user_id;

  -- Calculate projects count: Only bookings that have passed pending_approval
  -- Excludes: pending_approval, rejected, and cancelled bookings
  SELECT COUNT(*)
  INTO v_projects_count
  FROM bookings
  WHERE creative_user_id = v_creative_user_id
    AND client_user_id = v_client_user_id
    AND creative_status NOT IN ('pending_approval', 'rejected')
    AND client_status != 'cancelled';

  -- Update the creative_client_relationships table
  UPDATE creative_client_relationships
  SET 
    total_spent = v_total_spent,
    projects_count = v_projects_count,
    updated_at = NOW()
  WHERE creative_user_id = v_creative_user_id
    AND client_user_id = v_client_user_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_service_photo_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if adding this photo would exceed 6 photos for the service
    IF (SELECT COUNT(*) FROM service_photos WHERE service_id = NEW.service_id) >= 6 THEN
        RAISE EXCEPTION 'Maximum 6 photos allowed per service';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_service_photos_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM service_photos WHERE service_id = NEW.service_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 photos allowed per service';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_connected_services(client_user_id uuid)
 RETURNS TABLE(id uuid, title text, description text, price numeric, delivery_time text, status text, color text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, creative_user_id uuid, creative_name text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.price,
        cs.delivery_time,
        cs.status,
        cs.color,
        cs.is_active,
        cs.created_at,
        cs.updated_at,
        cs.creative_user_id,
        COALESCE(c.display_name, u.name, 'Unknown Creative') as creative_name
    FROM creative_services cs
    INNER JOIN creative_client_relationships ccr ON cs.creative_user_id = ccr.creative_user_id
    LEFT JOIN creatives c ON cs.creative_user_id = c.user_id
    LEFT JOIN users u ON cs.creative_user_id = u.user_id
    WHERE ccr.client_user_id = client_user_id
        AND cs.is_active = true
    ORDER BY cs.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_connected_services(client_user_id_param text)
 RETURNS TABLE(id uuid, title text, description text, price numeric, delivery_time text, status text, color text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, creative_user_id text, creative_name text, photos jsonb, requires_booking boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cs.id,
        cs.title,
        cs.description,
        cs.price,
        cs.delivery_time,
        cs.status,
        cs.color,
        cs.is_active,
        cs.created_at,
        cs.updated_at,
        cs.creative_user_id,
        COALESCE(c.display_name, u.name) AS creative_name,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', sp.id,
                    'photo_url', sp.photo_url,
                    'photo_filename', sp.photo_filename,
                    'photo_size_bytes', sp.photo_size_bytes,
                    'display_order', sp.display_order,
                    'is_primary', sp.is_primary,
                    'created_at', sp.created_at,
                    'updated_at', sp.updated_at
                ) ORDER BY sp.display_order
            )
            FROM public.service_photos sp
            WHERE sp.service_id = cs.id
        ) AS photos,
        cs.requires_booking
    FROM
        creative_client_relationships ccr
    JOIN
        creative_services cs ON ccr.creative_user_id = cs.creative_user_id
    LEFT JOIN
        creatives c ON cs.creative_user_id = c.user_id
    LEFT JOIN
        users u ON cs.creative_user_id = u.user_id
    WHERE
        ccr.client_user_id = client_user_id_param
        AND cs.is_active = TRUE
    ORDER BY
        cs.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_connected_services_with_photos(client_user_id uuid)
 RETURNS TABLE(id uuid, title text, description text, price numeric, delivery_time text, status text, color text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, creative_user_id uuid, creative_name text, photos jsonb, requires_booking boolean, payment_option text, split_deposit_amount numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.title,
    cs.description,
    cs.price,
    cs.delivery_time,
    cs.status,
    cs.color,
    cs.is_active,
    cs.created_at,
    cs.updated_at,
    cs.creative_user_id,
    COALESCE(c.display_name, u.name, 'Unknown Creative') as creative_name,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'photo_url', sp.photo_url,
            'photo_filename', sp.photo_filename,
            'photo_size_bytes', sp.photo_size_bytes,
            'is_primary', sp.is_primary,
            'display_order', sp.display_order
          ) ORDER BY sp.display_order
        )
        FROM service_photos sp
        WHERE sp.service_id = cs.id
      ),
      '[]'::jsonb
    ) as photos,
    cs.requires_booking,
    cs.payment_option,
    cs.split_deposit_amount
  FROM creative_services cs
  JOIN creative_client_relationships ccr ON cs.creative_user_id = ccr.creative_user_id
  LEFT JOIN creatives c ON cs.creative_user_id = c.user_id
  LEFT JOIN users u ON cs.creative_user_id = u.user_id
  WHERE ccr.client_user_id = client_user_id
    AND ccr.status = 'connected'
    AND cs.is_active = true
  ORDER BY cs.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_creative_service_counts(creative_user_ids text[])
 RETURNS TABLE(creative_user_id text, service_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cs.creative_user_id,
        COUNT(cs.id) as service_count
    FROM
        creative_services cs
    WHERE
        cs.creative_user_id = ANY(creative_user_ids)
        AND cs.is_active = TRUE
    GROUP BY
        cs.creative_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Delete from role-specific tables first (due to foreign key constraints)
  DELETE FROM public.creatives WHERE user_id = OLD.id;
  DELETE FROM public.clients WHERE user_id = OLD.id;
  DELETE FROM public.advocates WHERE user_id = OLD.id;
  
  -- Delete from public.users table
  DELETE FROM public.users WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Use INSERT ... ON CONFLICT DO NOTHING to prevent duplicates
  INSERT INTO public.users (
    user_id,
    name,
    email,
    profile_picture_url,
    avatar_source,
    roles,
    first_login,
    last_login_at,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'google',
    ARRAY['client'::text], -- Default role
    true, -- First login flag
    NOW(),
    NEW.created_at
  )
  ON CONFLICT (user_id) DO NOTHING; -- Ignore if user already exists
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_advocate_email_from_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If email is not provided, get it from users table
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email
    FROM users
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_user_login()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update last_login_at for the current authenticated user
  UPDATE public.users 
  SET last_login_at = NOW()
  WHERE user_id = auth.uid();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_creative_client_relationships_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_service_photos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE TRIGGER trigger_update_client_stats AFTER INSERT OR DELETE OR UPDATE OF amount_paid, payment_status, creative_status, client_status ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_creative_client_relationship_stats();


