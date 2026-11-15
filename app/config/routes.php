<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');
/**
 * ------------------------------------------------------------------
 * LavaLust - an opensource lightweight PHP MVC Framework
 * ------------------------------------------------------------------
 *
 * MIT License
 *
 * Copyright (c) 2020 Ronald M. Marasigan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @package LavaLust
 * @author Ronald M. Marasigan <ronald.marasigan@yahoo.com>
 * @since Version 1
 * @link https://github.com/ronmarasigan/LavaLust
 * @license https://opensource.org/licenses/MIT MIT License
 */

/*
| -------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------
| Here is where you can register web routes for your application.
|
|
*/
/** @var object $router **/

$router->get('/', 'Welcome::index');
$router->match('/api/register', 'Api::register', 'POST|OPTIONS');
$router->match('/api/login', 'Api::login', 'POST|OPTIONS');
$router->match('/api/logout', 'Api::logout', 'POST|OPTIONS');
$router->match('/api/session', 'Api::session', 'GET|OPTIONS');
$router->match('/api/profile', 'Api::get_profile', 'GET|OPTIONS');
$router->match('/api/profile', 'Api::update_profile', 'PUT|OPTIONS');
$router->match('/api/users', 'Api::get_users', 'GET|OPTIONS');
$router->match('/api/tax_rates', 'Api::get_tax_rates', 'GET|OPTIONS');
$router->match('/api/tax_rates', 'Api::update_tax_rate', 'PUT|OPTIONS');
$router->match('/api/payment_methods', 'Api::get_payment_methods', 'GET|OPTIONS');
$router->match('/api/payment_methods', 'Api::add_payment_method', 'POST|OPTIONS');
$router->match('/api/payment_methods/{id}', 'Api::delete_payment_method', 'DELETE|OPTIONS');
$router->match('/api/payment_methods/default', 'Api::set_default_payment_method', 'POST|OPTIONS');
$router->match('/api/audit_logs', 'Api::get_audit_logs', 'GET|OPTIONS');

// Password Recovery & OTP Routes
$router->match('/api/password-reset', 'Api::request_password_reset', 'POST|OPTIONS');
$router->match('/api/verify-otp', 'Api::verify_otp', 'POST|OPTIONS');
$router->match('/api/reset-password', 'Api::reset_password', 'POST|OPTIONS');

$router->match('/api/get_all_transactions', 'Api::get_all_transactions', 'GET|OPTIONS');
$router->match('/api/get_transactions', 'Api::get_transactions', 'GET|OPTIONS');
$router->match('/api/get_transactions/{id}', 'Api::get_transactions', 'GET|OPTIONS');
$router->match('/api/verify_ledger', 'Api::verify_ledger', 'GET|OPTIONS');
$router->match('/api/get_queue_tickets', 'Api::get_queue_tickets', 'GET|OPTIONS');
$router->match('/api/update_queue_ticket', 'Api::update_queue_ticket', 'POST|OPTIONS');
$router->match('/api/process_payment', 'Api::process_payment', 'POST|OPTIONS');
$router->match('/api/generate_queue_ticket', 'Api::generate_queue_ticket', 'POST|OPTIONS');
$router->match('/migrate', 'Migrate::index', 'GET');