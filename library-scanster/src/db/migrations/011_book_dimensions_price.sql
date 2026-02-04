-- Add depth column and unit columns for dimensions/weight, plus price fields
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS depth TEXT,
ADD COLUMN IF NOT EXISTS dimension_unit TEXT DEFAULT 'mm',
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'g',
ADD COLUMN IF NOT EXISTS price TEXT,
ADD COLUMN IF NOT EXISTS price_published TEXT,
ADD COLUMN IF NOT EXISTS price_currency TEXT DEFAULT 'USD';

COMMENT ON COLUMN public.books.depth IS 'Book depth/thickness';
COMMENT ON COLUMN public.books.dimension_unit IS 'Unit for width/height/depth: mm, cm, in';
COMMENT ON COLUMN public.books.weight_unit IS 'Unit for weight: g, kg, lb, oz';
COMMENT ON COLUMN public.books.price IS 'Current/selling price';
COMMENT ON COLUMN public.books.price_published IS 'Original published/list price';
COMMENT ON COLUMN public.books.price_currency IS 'Currency code: USD, EUR, GBP, etc.';
