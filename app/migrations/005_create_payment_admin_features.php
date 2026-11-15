<?php

class Create_payment_admin_features {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
        $this->_lava->call->dbforge();
    }

    public function up()
    {
        if (!$this->_lava->dbforge->table_exists('tax_rates')) {
            $this->_lava->dbforge
                ->add_field([
                    'id' => [
                        'type'           => 'INT',
                        'unsigned'       => TRUE,
                        'auto_increment' => TRUE,
                        'null'           => FALSE,
                    ],
                    'tax_type' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 100,
                        'null'       => FALSE,
                    ],
                    'rate_percent' => [
                        'type'       => 'DECIMAL',
                        'constraint' => '7,4',
                        'null'       => TRUE,
                        'default'    => NULL,
                    ],
                    'flat_fee' => [
                        'type'       => 'DECIMAL',
                        'constraint' => '12,2',
                        'null'       => TRUE,
                        'default'    => NULL,
                    ],
                    'configured' => [
                        'type'       => 'TINYINT',
                        'constraint' => 1,
                        'unsigned'   => TRUE,
                        'null'       => FALSE,
                        'default'    => 0,
                    ],
                    'updated_by' => [
                        'type'     => 'INT',
                        'unsigned' => TRUE,
                        'null'     => TRUE,
                        'default'  => NULL,
                    ],
                    'updated_at' => [
                        'type'    => 'DATETIME',
                        'null'    => FALSE,
                        'default' => 'CURRENT_TIMESTAMP',
                    ],
                ])
                ->add_key('id', primary: TRUE)
                ->add_key('tax_type', unique: TRUE, name: 'tax_rate_type_unique')
                ->create_table('tax_rates');
        }

        foreach (['Real Property Tax (RPT)', 'Business Tax', 'Professional Tax'] as $tax_type) {
            $existing = $this->_lava->db
                ->table('tax_rates')
                ->where('tax_type', $tax_type)
                ->get_all();
            if (empty($existing)) {
                $this->_lava->db->table('tax_rates')->insert([
                    'tax_type' => $tax_type,
                    'rate_percent' => NULL,
                    'flat_fee' => NULL,
                    'configured' => 0,
                ]);
            }
        }

        if (!$this->_lava->dbforge->table_exists('taxpayer_payment_methods')) {
            $this->_lava->dbforge
                ->add_field([
                    'id' => [
                        'type'           => 'INT',
                        'unsigned'       => TRUE,
                        'auto_increment' => TRUE,
                        'null'           => FALSE,
                    ],
                    'user_id' => [
                        'type'     => 'INT',
                        'unsigned' => TRUE,
                        'null'     => FALSE,
                    ],
                    'provider' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 40,
                        'null'       => FALSE,
                    ],
                    'display_name' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 80,
                        'null'       => FALSE,
                    ],
                    'account_last4' => [
                        'type'       => 'CHAR',
                        'constraint' => 4,
                        'null'       => FALSE,
                    ],
                    'is_default' => [
                        'type'       => 'TINYINT',
                        'constraint' => 1,
                        'unsigned'   => TRUE,
                        'null'       => FALSE,
                        'default'    => 0,
                    ],
                    'created_at' => [
                        'type'    => 'DATETIME',
                        'null'    => FALSE,
                        'default' => 'CURRENT_TIMESTAMP',
                    ],
                ])
                ->add_key('id', primary: TRUE)
                ->add_key('user_id', name: 'payment_method_user_idx')
                ->create_table('taxpayer_payment_methods');
        }

        if (!$this->_lava->dbforge->table_exists('audit_logs')) {
            $this->_lava->dbforge
                ->add_field([
                    'id' => [
                        'type'           => 'BIGINT',
                        'unsigned'       => TRUE,
                        'auto_increment' => TRUE,
                        'null'           => FALSE,
                    ],
                    'actor_id' => [
                        'type'     => 'INT',
                        'unsigned' => TRUE,
                        'null'     => TRUE,
                        'default'  => NULL,
                    ],
                    'actor_email' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 255,
                        'null'       => TRUE,
                        'default'    => NULL,
                    ],
                    'action' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 100,
                        'null'       => FALSE,
                    ],
                    'entity' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 100,
                        'null'       => TRUE,
                        'default'    => NULL,
                    ],
                    'entity_id' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 64,
                        'null'       => TRUE,
                        'default'    => NULL,
                    ],
                    'details' => [
                        'type' => 'TEXT',
                        'null' => TRUE,
                    ],
                    'ip_address' => [
                        'type'       => 'VARCHAR',
                        'constraint' => 45,
                        'null'       => TRUE,
                        'default'    => NULL,
                    ],
                    'created_at' => [
                        'type'    => 'DATETIME',
                        'null'    => FALSE,
                        'default' => 'CURRENT_TIMESTAMP',
                    ],
                ])
                ->add_key('id', primary: TRUE)
                ->add_key('actor_id', name: 'audit_actor_idx')
                ->add_key('created_at', name: 'audit_created_idx')
                ->create_table('audit_logs');
        }
    }

    public function down()
    {
        // Retain rate, payment-method, and audit history during rollbacks.
    }
}
