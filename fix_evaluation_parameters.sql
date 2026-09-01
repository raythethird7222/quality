-- Migration script to fix evaluation_parameters account/lob mapping
-- Ensures evaluation_parameters has the correct account/lob assignments
-- Target: All NEGOT and CXL-P/H guidelines should be account_id=1, lob_id=7

BEGIN;

-- Update NEGOT guidelines to correct account/lob
UPDATE evaluation_parameters
SET account_id = 1, lob_id = 7
WHERE guideline = 'NEGOT'
AND (account_id <> 1 OR lob_id <> 7);

-- Update CXL - PHONE guidelines to correct account/lob  
UPDATE evaluation_parameters
SET account_id = 1, lob_id = 7
WHERE guideline = 'CXL - PHONE'
AND (account_id <> 1 OR lob_id <> 7);

-- Update CXL - CHAT guidelines to correct account/lob
UPDATE evaluation_parameters
SET account_id = 1, lob_id = 7
WHERE guideline = 'CXL - CHAT'
AND (account_id <> 1 OR lob_id <> 7);

-- Verify the fix
SELECT 
  guideline,
  COUNT(*) as record_count,
  account_id,
  lob_id
FROM evaluation_parameters
WHERE guideline IN ('NEGOT', 'CXL - PHONE', 'CXL - CHAT')
GROUP BY guideline, account_id, lob_id;

COMMIT;
