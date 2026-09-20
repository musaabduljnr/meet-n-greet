-- ============================================================================
-- KOUNTRY WAYNE VIP PLATFORM: SEED SUPER ADMIN SCRIPT
-- Email: admin@kountrywayne.com
-- Role: SUPER_ADMIN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    new_user_id UUID;
    target_email TEXT := 'admin@kountrywayne.com';
    target_password TEXT := 'Password@123';
BEGIN
    -- 1. Check if user already exists in auth.users
    SELECT id INTO new_user_id 
    FROM auth.users 
    WHERE email = target_email;

    -- 2. If user does not exist in auth.users, create it
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            target_email,
            crypt(target_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Super Admin"}'::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

        -- Insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, target_email)::jsonb,
            'email',
            new_user_id::text,
            NOW(),
            NOW(),
            NOW()
        );
    ELSE
        -- If user exists, update their password and confirm email
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(target_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = new_user_id;
    END IF;

    -- 3. Upsert into public.admins table with SUPER_ADMIN role
    INSERT INTO public.admins (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        target_email,
        'Super Administrator',
        'SUPER_ADMIN',
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'SUPER_ADMIN',
        is_active = TRUE,
        updated_at = NOW();

    RAISE NOTICE 'Super Admin (%) successfully configured with ID: %', target_email, new_user_id;
END $$;
