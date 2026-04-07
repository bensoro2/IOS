-- Create storage bucket for activity images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-images', 
  'activity-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload activity images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'activity-images');

-- Allow public to view activity images
CREATE POLICY "Anyone can view activity images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'activity-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their own activity images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'activity-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own activity images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'activity-images' AND auth.uid()::text = (storage.foldername(name))[1]);