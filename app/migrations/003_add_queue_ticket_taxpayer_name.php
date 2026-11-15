<?php

class Add_queue_ticket_taxpayer_name {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
        $this->_lava->call->dbforge();
    }

    public function up()
    {
        if (
            $this->_lava->dbforge->table_exists('queue_tickets')
            && !$this->_lava->dbforge->column_exists('queue_tickets', 'taxpayer_name')
        ) {
            $this->_lava->dbforge->add_column('queue_tickets', [
                'taxpayer_name' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => TRUE,
                    'default'    => NULL,
                ],
            ]);
        }
    }

    public function down()
    {
        if (
            $this->_lava->dbforge->table_exists('queue_tickets')
            && $this->_lava->dbforge->column_exists('queue_tickets', 'taxpayer_name')
        ) {
            $this->_lava->dbforge->drop_column('queue_tickets', 'taxpayer_name');
        }
    }
}
