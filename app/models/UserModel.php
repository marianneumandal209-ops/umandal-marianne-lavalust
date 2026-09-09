<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class UserModel extends Model
{
    protected $table = 'users'; // Siguraduhing 'users' ang pangalan ng table ninyo sa database

    public function __construct()
    {
        parent::__construct();
        $this->call->database();
    }

    public function get_user($username)
    {
        return $this->db
            ->table($this->table)
            ->where('username', $username)
            ->get();
    }
}