ALTER TABLE feedback ADD COLUMN IF NOT EXISTS mood VARCHAR(20);
UPDATE feedback SET mood=CASE WHEN rating <= 2 THEN 'sad' WHEN rating = 3 THEN 'neutral' ELSE 'happy' END WHERE mood IS NULL;
ALTER TABLE feedback ALTER COLUMN mood SET NOT NULL;
ALTER TABLE feedback ADD CONSTRAINT feedback_mood_check CHECK (mood IN ('sad','neutral','happy'));
CREATE INDEX IF NOT EXISTS idx_feedback_mood_created_at ON feedback(mood,created_at);
