<?php

class Migrate extends Controller {

    public function __construct() {
        parent::__construct();
        $this->call->database();
    }

    public function index() {
        $db = $this->db;
        
        try {
            // Fetch the current head to ensure the table exists
            $heads = $db->table('transaction_ledger_heads')->where('id', 1)->get_all();
            
            if (!empty($heads)) {
                if (!array_key_exists('legacy_max_transaction_id', $heads[0])) {
                    echo "Please add the legacy_max_transaction_id column first using your migration file or phpMyAdmin.";
                    return;
                }

                if ($heads[0]['legacy_max_transaction_id'] === null) {
                    $ledger_rows = $db->table('transaction_ledger_entries')->select('MIN(transaction_id) AS first_transaction_id')->get_all();
                    $first_ledger_transaction_id = $ledger_rows[0]['first_transaction_id'] ?? null;
                    
                    $legacy_max_transaction_id = is_numeric($first_ledger_transaction_id) ? max(0, (int) $first_ledger_transaction_id - 1) : 0;
                    
                    $db->table('transaction_ledger_heads')
                       ->where('id', 1)
                       ->update(['legacy_max_transaction_id' => $legacy_max_transaction_id]);
                       
                    echo "Success! The legacy boundary has been set to ID: " . $legacy_max_transaction_id;
                } else {
                    echo "The legacy boundary has already been set previously.";
                }
            } else {
                echo "Error: No ledger head record found with id = 1.";
            }
        } catch (Exception $e) {
            echo "Error: " . $e->getMessage();
        }
    }
}