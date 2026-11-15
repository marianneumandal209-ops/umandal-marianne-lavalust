<?php

class Create_transaction_ledger {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
        $this->_lava->call->dbforge();
    }

    public function up()
    {
        if (!$this->_lava->dbforge->table_exists('transaction_ledger_entries')) {
            $this->_lava->dbforge
                ->add_field([
                    'id' => [
                        'type'           => 'INT',
                        'unsigned'       => TRUE,
                        'auto_increment' => TRUE,
                        'null'           => FALSE,
                    ],
                    'transaction_id' => [
                        'type'     => 'INT',
                        'unsigned' => TRUE,
                        'null'     => FALSE,
                    ],
                    'previous_hash' => [
                        'type'       => 'CHAR',
                        'constraint' => 64,
                        'null'       => FALSE,
                    ],
                    'entry_hash' => [
                        'type'       => 'CHAR',
                        'constraint' => 64,
                        'null'       => FALSE,
                    ],
                    'created_at' => [
                        'type'    => 'DATETIME',
                        'null'    => FALSE,
                    ],
                ])
                ->add_key('id', primary: TRUE)
                ->add_key('transaction_id', unique: TRUE, name: 'ledger_transaction_unique')
                ->create_table('transaction_ledger_entries');
        }

        if (!$this->_lava->dbforge->table_exists('transaction_ledger_heads')) {
            $this->_lava->dbforge
                ->add_field([
                    'id' => [
                        'type'     => 'TINYINT',
                        'unsigned' => TRUE,
                        'null'     => FALSE,
                    ],
                    'head_hash' => [
                        'type'       => 'CHAR',
                        'constraint' => 64,
                        'null'       => FALSE,
                    ],
                ])
                ->add_key('id', primary: TRUE)
                ->create_table('transaction_ledger_heads');
        }

        $heads = $this->_lava->db
            ->table('transaction_ledger_heads')
            ->where('id', 1)
            ->get_all();
        if (empty($heads)) {
            $this->_lava->db->table('transaction_ledger_heads')->insert([
                'id' => 1,
                'head_hash' => str_repeat('0', 64)
            ]);
        }
    }

    public function down()
    {
        // Ledger history is append-only and must not be deleted by rollback.
    }
}
