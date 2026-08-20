<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class StudentController extends Controller
{
    private function studentData()
    {
        return [
            'title'      => 'Student Information',
            'student_id' => 'MCC2024-00168',
            'name'       => 'Marianne Grace I. Umandal',
            'birthday'   => 'May 19, 2006',
            'age'        => '20',
            'course'     => 'BS Information Technology',
            'year'       => '3rd Year',
            'section'    => '3-F4',
            'email'      => 'marianneumandal209@gmail.com',
            'address'    => 'Tigkan, Naujan, Oriental Mindoro',
            'contact'    => '09948988609',
        ];
    }

    public function index()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $data = $this->studentData();
        $data['notice'] = $_SESSION['student_notice'] ?? null;
        unset($_SESSION['student_notice']);

        $this->call->view('student/home', $data);
    }

    public function openProfile()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['student_profile_pass'] = bin2hex(random_bytes(16));
        $_SESSION['student_profile_pass_time'] = time();

        header('Location: ' . site_url('student/profile'));
        exit;
    }

    public function profile()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $data = $this->studentData();
        $data['title'] = 'Student Profile';
        $data['middleware_message'] = $_SESSION['middleware_message'] ?? 'Access verified by StudentMiddleware.';
        unset($_SESSION['middleware_message']);

        // Pass $data array straight to the profile view
        $this->call->view('student/profile', $data);
    }
}
?>