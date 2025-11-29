-- Fix foreign key constraint to allow transaction deletion
ALTER TABLE bank_balance_audit 
DROP CONSTRAINT IF EXISTS bank_balance_audit_transaction_id_fkey;

ALTER TABLE bank_balance_audit 
ADD CONSTRAINT bank_balance_audit_transaction_id_fkey 
FOREIGN KEY (transaction_id) 
REFERENCES transactions(id) 
ON DELETE CASCADE;