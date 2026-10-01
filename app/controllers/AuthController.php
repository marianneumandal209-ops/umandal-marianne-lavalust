<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class AuthController extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->call->library('session'); // Idinagdag ito para ma-load ang session
        $this->call->model('UserModel');
        $this->call->helper('url');
    }

    public function login()
    {
        $this->call->view('auth/login');
    }

    public function authenticate()
    {
        $username = $this->io->post('username');
        $password = $this->io->post('password');

        $user = $this->UserModel->get_user($username);

        // Pinalitan ko ang password_verify ng direct comparison dahil plain text ang password sa DB
        if ($user && $user['password'] === $password) {
            // I-save sa session kapag successful ang login
            $this->session->set_userdata([
                'user_id' => $user['id'],
                'username' => $user['username'],
                'logged_in' => TRUE
            ]);

            redirect('products');
        } else {
            $data['error'] = 'Invalid username or password';
            $this->call->view('auth/login', $data);
        }
    }

    public function logout()
    {
        $this->session->sess_destroy();
        redirect('auth/login');
    }
}