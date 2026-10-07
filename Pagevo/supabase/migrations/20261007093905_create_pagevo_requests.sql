/*
# Create Pagevo project request intake

1. New Tables
- `requests` stores customer project reservations submitted from the public storefront.
- `id` is the internal UUID for the request.
- `request_code` is the human-friendly Pagevo reference shown after submission.
- Customer fields include name, phone, email, brand, country, and preferred contact method.
- Project fields include description, selected website, purchase type, add-ons, hosting, customization, and estimated price.
- Workflow fields include status, assigned team member, admin notes, and timestamps.

2. Security
- Row level security is enabled.
- Anonymous and authenticated visitors can create requests.
- Request records cannot be read, changed, or deleted through the public client.
- This keeps customer information private while allowing the storefront request form to work without requiring an account.

3. Important Notes
- The estimated price is informational and is confirmed by the Pagevo team before any payment.
- Add-ons are stored as a JSON list so the storefront can preserve the requested configuration.
*/

CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  brand_name text NOT NULL,
  country text NOT NULL,
  contact_method text NOT NULL DEFAULT 'Email',
  description text NOT NULL,
  selected_website text NOT NULL,
  website_id text NOT NULL,
  purchase_type text NOT NULL,
  package text,
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  hosting boolean NOT NULL DEFAULT false,
  customization numeric NOT NULL DEFAULT 0,
  estimated_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'New',
  assigned_to text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit Pagevo requests" ON public.requests;
CREATE POLICY "Public can submit Pagevo requests"
ON public.requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(customer_name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 5 AND 254
  AND char_length(description) BETWEEN 5 AND 5000
  AND estimated_price >= 0
);

DROP POLICY IF EXISTS "Public cannot read Pagevo requests" ON public.requests;
CREATE POLICY "Public cannot read Pagevo requests"
ON public.requests FOR SELECT
TO anon, authenticated
USING (false);

DROP POLICY IF EXISTS "Public cannot update Pagevo requests" ON public.requests;
CREATE POLICY "Public cannot update Pagevo requests"
ON public.requests FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Public cannot delete Pagevo requests" ON public.requests;
CREATE POLICY "Public cannot delete Pagevo requests"
ON public.requests FOR DELETE
TO anon, authenticated
USING (false);

CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests(status);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON public.requests(created_at DESC);
