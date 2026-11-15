<?php

class Add_ledger_legacy_boundary {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
        $this->_lava->call->dbforge();
    }

    public function up()
    {
        if (
            !$this->_lava->dbforge->table_exists('transactions')
            || !$this->_lava->dbforge->table_exists('transaction_ledger_entries')
            || !$this->_lava->dbforge->table_exists('transaction_ledger_heads')
        ) {
            throw new RuntimeException('Transaction ledger tables must exist before adding the legacy boundary.');
        }

        if (!$this->_lava->dbforge->column_exists('transaction_ledger_heads', 'legacy_max_transaction_id')) {
            $this->_lava->dbforge->add_column('transaction_ledger_heads', [
                'legacy_max_transaction_id' => [
                    'type'     => 'INT',
                    'unsigned' => TRUE,
                    'null'     => TRUE,
                    'default'  => NULL,
                ],
            ]);
        }

        $heads = $this->_lava->db
            ->table('transaction_ledger_heads')
            ->where('id', 1)
            ->get_all();
        if (empty($heads)) {
            throw new RuntimeException('The transaction ledger head is not initialized.');
        }

        if ($heads[0]['legacy_max_transaction_id'] === null) {
            $ledger_rows = $this->_lava->db
                ->table('transaction_ledger_entries')
                ->select('MIN(transaction_id) AS first_transaction_id')
                ->get_all();
            $first_ledger_transaction_id = $ledger_rows[0]['first_transaction_id'] ?? null;
            if (is_numeric($first_ledger_transaction_id)) {
                $legacy_max_transaction_id = max(0, (int) $first_ledger_transaction_id - 1);
            } else {
                $transaction_rows = $this->_lava->db
                    ->table('transactions')
                    ->select('MAX(id) AS max_id')
                    ->get_all();
                $legacy_max_transaction_id = (int) ($transaction_rows[0]['max_id'] ?? 0);
            }
            $this->_lava->db
                ->table('transaction_ledger_heads')
                ->where('id', 1)
                ->update(['legacy_max_transaction_id' => $legacy_max_transaction_id]);
        }
    }

    public function down()
    {
        // Keep the boundary so rollback cannot make unlinked transactions appear legacy.
    }
}