<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Api extends Controller {
    public function __construct() {
        parent::__construct();

        handle_cors();
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            $is_https = (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
                || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
            session_set_cookie_params([
                'httponly' => true,
                'secure' => $is_https,
                'samesite' => $is_https ? 'None' : 'Lax',
                'path' => '/'
            ]);
            session_start();
        }
    }

    private function respond($status, array $payload) {
        http_response_code($status);
        echo json_encode($payload);
    }

    private function request_data() {
        $data = json_decode(file_get_contents('php://input'), true);
        return is_array($data) ? $data : [];
    }

    private function ledger_hash(array $transaction, string $previous_hash) {
        $payload = [
            'version' => 1,
            'transaction_id' => (int) $transaction['id'],
            'e_or_number' => (string) $transaction['e_or_number'],
            'taxpayer_id' => (int) $transaction['taxpayer_id'],
            'tax_type' => (string) $transaction['tax_type'],
            'amount' => number_format((float) $transaction['amount'], 2, '.', ''),
            'payment_method' => (string) $transaction['payment_method'],
            'created_at' => (string) $transaction['created_at'],
            'previous_hash' => $previous_hash
        ];

        return hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    }

    private function ledger_integrity($db) {
        $prefix = database_config()['main']['dbprefix'] ?? '';
        $statement = $db->raw(
            'SELECT l.id AS ledger_index, l.transaction_id, l.previous_hash, l.entry_hash, ' .
            't.id, t.e_or_number, t.taxpayer_id, t.tax_type, t.amount, t.payment_method, t.created_at, t.block_hash ' .
            'FROM ' . $prefix . 'transaction_ledger_entries l ' .
            'LEFT JOIN ' . $prefix . 'transactions t ON t.id = l.transaction_id ' .
            'ORDER BY l.id ASC'
        );
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        $heads = $db->table('transaction_ledger_heads')->where('id', 1)->get_all();
        $head_hash = $heads[0]['head_hash'] ?? null;
        $legacy_max_transaction_id = $heads[0]['legacy_max_transaction_id'] ?? null;
        $baseline_valid = is_numeric($legacy_max_transaction_id);
        $legacy_max_transaction_id = $baseline_valid ? (int) $legacy_max_transaction_id : -1;
        $unlinked_statement = $db->raw(
            'SELECT t.id FROM ' . $prefix . 'transactions t ' .
            'LEFT JOIN ' . $prefix . 'transaction_ledger_entries l ON l.transaction_id = t.id ' .
            'WHERE l.transaction_id IS NULL AND t.id > ?',
            [$legacy_max_transaction_id]
        );
        $unlinked_transaction_ids = array_map(
            'intval',
            $unlinked_statement->fetchAll(PDO::FETCH_COLUMN)
        );
        $unlinked_transactions = array_fill_keys($unlinked_transaction_ids, true);
        $previous_hash = str_repeat('0', 64);
        $valid = is_string($head_hash) && $baseline_valid && empty($unlinked_transaction_ids);
        $entries = [];

        foreach ($rows as $row) {
            $transaction_exists = isset($row['id']);
            $expected_hash = $transaction_exists
                ? $this->ledger_hash($row, $previous_hash)
                : null;
            $entry_valid = $transaction_exists
                && hash_equals($previous_hash, (string) $row['previous_hash'])
                && hash_equals((string) $row['entry_hash'], $expected_hash)
                && hash_equals((string) $row['block_hash'], (string) $row['entry_hash']);
            $valid = $valid && $entry_valid;
            $entries[(int) $row['transaction_id']] = [
                'ledger_index' => (int) $row['ledger_index'],
                'previous_hash' => $row['previous_hash'],
                'entry_hash' => $row['entry_hash']
            ];
            $previous_hash = (string) $row['entry_hash'];
        }

        return [
            'valid' => $valid && hash_equals((string) $head_hash, $previous_hash),
            'entry_count' => count($rows),
            'head_hash' => $head_hash,
            'entries' => $entries,
            'unlinked_transactions' => $unlinked_transactions
        ];
    }

    private function annotate_ledger_rows(array $rows, array $ledger) {
        foreach ($rows as &$row) {
            $entry = $ledger['entries'][(int) $row['id']] ?? null;
            $row['ledger_status'] = !$entry
                ? (isset($ledger['unlinked_transactions'][(int) $row['id']]) ? 'invalid' : 'legacy')
                : ($ledger['valid'] ? 'verified' : 'invalid');
            $row['ledger_index'] = $entry['ledger_index'] ?? null;
            $row['previous_hash'] = $entry['previous_hash'] ?? null;
        }
        unset($row);

        return $rows;
    }

    private function require_user($roles = []) {
        $user = $_SESSION['user'] ?? null;
        if (!$user) {
            $this->respond(401, ['status' => 'error', 'message' => 'Please sign in to continue.']);
            return false;
        }

        if ($roles && !in_array($user['role'], $roles, true)) {
            $this->respond(403, ['status' => 'error', 'message' => 'You do not have permission to perform this action.']);
            return false;
        }

        return $user;
    }

    private function record_audit($db, array $actor, string $action, $entity = null, $entity_id = null, array $details = []) {
        $db->table('audit_logs')->insert([
            'actor_id' => isset($actor['id']) ? (int) $actor['id'] : null,
            'actor_email' => $actor['email'] ?? null,
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entity_id === null ? null : (string) $entity_id,
            'details' => $details
                ? json_encode($details, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)
                : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }

    private function profile_for_user($user_id) {
        $profiles = lava_instance()->db
            ->table('taxpayer_profiles')
            ->where('user_id', $user_id)
            ->get_all();
        return $profiles[0] ?? [];
    }

    public function register() {
        $input = $this->request_data();
        $full_name = trim(is_string($input['full_name'] ?? null) ? $input['full_name'] : '');
        $email = strtolower(trim(is_string($input['email'] ?? null) ? $input['email'] : ''));
        $password = is_string($input['password'] ?? null) ? $input['password'] : '';

        if ($full_name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            $this->respond(422, [
                'status' => 'error',
                'message' => 'Enter a valid name and email, and a password with at least 8 characters.'
            ]);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        if ($db->table('users')->where('email', $email)->get_all()) {
            $this->respond(409, ['status' => 'error', 'message' => 'An account with this email already exists.']);
            return;
        }

        $db->transaction();
        try {
            $user_id = $db->table('users')->insert([
                'email' => $email,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => 'taxpayer'
            ]);
            $db->table('taxpayer_profiles')->insert([
                'user_id' => $user_id,
                'full_name' => $full_name
            ]);
            $this->record_audit($db, [
                'id' => $user_id,
                'email' => $email
            ], 'user.registered', 'user', $user_id);
            $db->commit();
        } catch (Throwable $error) {
            $db->roll_back();
            throw $error;
        }

        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => $user_id,
            'email' => $email,
            'full_name' => $full_name,
            'role' => 'taxpayer'
        ];

        $this->respond(201, ['status' => 'success', 'data' => $_SESSION['user']]);
    }

    public function login() {
        $input = $this->request_data();
        $email = strtolower(trim(is_string($input['email'] ?? null) ? $input['email'] : ''));
        $password = is_string($input['password'] ?? null) ? $input['password'] : '';
        $this->call->database();

        $matches = lava_instance()->db
            ->table('users')
            ->where('email', $email)
            ->get_all();
        $account = $matches[0] ?? null;

        $password_valid = $account && (
            password_verify($password, $account['password'])
            || hash_equals($account['password'], $password)
        );
        if (!$password_valid) {
            $this->respond(401, ['status' => 'error', 'message' => 'Email or password is incorrect.']);
            return;
        }

        if (password_get_info($account['password'])['algo'] === null) {
            lava_instance()->db
                ->table('users')
                ->where('id', $account['id'])
                ->update(['password' => password_hash($password, PASSWORD_DEFAULT)]);
        }

        $profile = $this->profile_for_user($account['id']);
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => (int) $account['id'],
            'email' => $account['email'],
            'full_name' => $profile['full_name'] ?? '',
            'role' => $account['role']
        ];
        try {
            $this->record_audit(lava_instance()->db, $_SESSION['user'], 'session.login', 'user', $account['id']);
        } catch (Throwable $error) {
            error_log('Unable to record login audit event: ' . $error->getMessage());
        }

        $this->respond(200, ['status' => 'success', 'data' => $_SESSION['user']]);
    }

    public function logout() {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        $this->respond(200, ['status' => 'success']);
    }

    public function session() {
        $user = $_SESSION['user'] ?? null;
        if (!$user) {
            $this->respond(401, ['status' => 'error', 'message' => 'No active session.']);
            return;
        }
        $this->respond(200, ['status' => 'success', 'data' => $user]);
    }

    public function get_profile() {
        $user = $this->require_user();
        if (!$user) return;

        $this->call->database();
        $profile = $this->profile_for_user($user['id']);
        $this->respond(200, [
            'status' => 'success',
            'data' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'full_name' => $profile['full_name'] ?? '',
                'contact_number' => $profile['contact_number'] ?? '',
                'address' => $profile['address'] ?? ''
            ]
        ]);
    }

    public function update_profile() {
        $user = $this->require_user();
        if (!$user) return;

        $input = $this->request_data();
        $full_name = trim(is_string($input['full_name'] ?? null) ? $input['full_name'] : '');
        if ($full_name === '') {
            $this->respond(422, ['status' => 'error', 'message' => 'Full name is required.']);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        $profile = $this->profile_for_user($user['id']);
        $profile_data = [
            'full_name' => $full_name,
            'contact_number' => trim(is_string($input['contact_number'] ?? null) ? $input['contact_number'] : ''),
            'address' => trim(is_string($input['address'] ?? null) ? $input['address'] : '')
        ];

        if ($profile) {
            $db->table('taxpayer_profiles')->where('user_id', $user['id'])->update($profile_data);
        } else {
            $profile_data['user_id'] = $user['id'];
            $db->table('taxpayer_profiles')->insert($profile_data);
        }
        $this->record_audit($db, $user, 'profile.updated', 'taxpayer_profile', $user['id']);

        $_SESSION['user']['full_name'] = $full_name;
        $this->respond(200, ['status' => 'success', 'data' => array_merge($user, $profile_data)]);
    }

    public function get_users() {
        if (!$this->require_user(['admin'])) return;

        $this->call->database();
        $users = lava_instance()->db
            ->table('users')
            ->select('users.id, users.email, users.role, users.created_at, taxpayer_profiles.full_name AS full_name')
            ->join('taxpayer_profiles', 'users.id = taxpayer_profiles.user_id', 'LEFT ')
            ->order_by('users.id', 'ASC')
            ->get_all();

        if (!is_array($users)) {
            $this->respond(500, ['status' => 'error', 'message' => 'User accounts could not be loaded.']);
            return;
        }

        foreach ($users as &$account) {
            $account['full_name'] = $account['full_name'] ?: $account['email'];
        }
        unset($account);

        $this->respond(200, ['status' => 'success', 'data' => $users]);
    }

    public function get_tax_rates() {
        if (!$this->require_user(['admin'])) return;

        $this->call->database();
        $rows = lava_instance()->db
            ->table('tax_rates')
            ->order_by('id', 'ASC')
            ->get_all();

        $this->respond(200, ['status' => 'success', 'data' => is_array($rows) ? $rows : []]);
    }

    public function update_tax_rate() {
        $user = $this->require_user(['admin']);
        if (!$user) return;

        $input = $this->request_data();
        $tax_type = trim(is_string($input['tax_type'] ?? null) ? $input['tax_type'] : '');
        $rate_percent = $input['rate_percent'] ?? null;
        $flat_fee = $input['flat_fee'] ?? 0;
        if (
            !in_array($tax_type, ['Real Property Tax (RPT)', 'Business Tax', 'Professional Tax'], true)
            || !is_numeric($rate_percent)
            || !is_finite((float) $rate_percent)
            || (float) $rate_percent < 0
            || (float) $rate_percent > 100
            || !is_numeric($flat_fee)
            || !is_finite((float) $flat_fee)
            || (float) $flat_fee < 0
        ) {
            $this->respond(422, ['status' => 'error', 'message' => 'Enter a supported tax type, a rate from 0 to 100, and a non-negative flat fee.']);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        $matches = $db->table('tax_rates')->where('tax_type', $tax_type)->get_all();
        $rate = $matches[0] ?? null;
        if (!$rate) {
            $this->respond(404, ['status' => 'error', 'message' => 'Tax-rate configuration was not found. Run the latest database migration.']);
            return;
        }

        $updated = [
            'rate_percent' => number_format((float) $rate_percent, 4, '.', ''),
            'flat_fee' => number_format((float) $flat_fee, 2, '.', ''),
            'configured' => 1,
            'updated_by' => (int) $user['id'],
            'updated_at' => date('Y-m-d H:i:s')
        ];
        $db->transaction();
        try {
            $db->table('tax_rates')->where('id', $rate['id'])->update($updated);
            $this->record_audit($db, $user, 'tax_rate.updated', 'tax_rate', $rate['id'], [
                'tax_type' => $tax_type,
                'rate_percent' => $updated['rate_percent'],
                'flat_fee' => $updated['flat_fee']
            ]);
            $db->commit();
        } catch (Throwable $error) {
            $db->roll_back();
            throw $error;
        }

        $this->respond(200, [
            'status' => 'success',
            'data' => array_merge($rate, $updated)
        ]);
    }

    public function get_payment_methods() {
        $user = $this->require_user(['taxpayer']);
        if (!$user) return;

        $this->call->database();
        $methods = lava_instance()->db
            ->table('taxpayer_payment_methods')
            ->where('user_id', $user['id'])
            ->order_by('is_default', 'DESC')
            ->order_by('id', 'DESC')
            ->get_all();
        $this->respond(200, ['status' => 'success', 'data' => is_array($methods) ? $methods : []]);
    }

    public function add_payment_method() {
        $user = $this->require_user(['taxpayer']);
        if (!$user) return;

        $input = $this->request_data();
        $provider = trim(is_string($input['provider'] ?? null) ? $input['provider'] : '');
        $display_name = trim(is_string($input['display_name'] ?? null) ? $input['display_name'] : '');
        $account_last4 = trim(is_string($input['account_last4'] ?? null) ? $input['account_last4'] : '');
        if (
            !in_array($provider, ['Bank', 'GCash', 'Maya'], true)
            || $display_name === ''
            || strlen($display_name) > 80
            || !preg_match('/^[0-9]{4}$/', $account_last4)
        ) {
            $this->respond(422, ['status' => 'error', 'message' => 'Choose a supported provider, enter a label, and provide only the last four digits.']);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        $existing = $db->table('taxpayer_payment_methods')->where('user_id', $user['id'])->get_all();
        $make_default = empty($existing);
        $db->transaction();
        try {
            if ($make_default) {
                $db->table('taxpayer_payment_methods')
                    ->where('user_id', $user['id'])
                    ->update(['is_default' => 0]);
            }
            $method = [
                'user_id' => (int) $user['id'],
                'provider' => $provider,
                'display_name' => $display_name,
                'account_last4' => $account_last4,
                'is_default' => $make_default ? 1 : 0,
                'created_at' => date('Y-m-d H:i:s')
            ];
            $method['id'] = $db->table('taxpayer_payment_methods')->insert($method);
            $this->record_audit($db, $user, 'payment_method.added', 'payment_method', $method['id'], [
                'provider' => $provider,
                'account_last4' => $account_last4
            ]);
            $db->commit();
        } catch (Throwable $error) {
            $db->roll_back();
            throw $error;
        }

        $this->respond(201, ['status' => 'success', 'data' => $method]);
    }

    public function set_default_payment_method() {
        $user = $this->require_user(['taxpayer']);
        if (!$user) return;

        $method_id = (int) ($this->request_data()['id'] ?? 0);
        $this->call->database();
        $db = lava_instance()->db;
        $matches = $db->table('taxpayer_payment_methods')
            ->where('id', $method_id)
            ->where('user_id', $user['id'])
            ->get_all();
        if ($method_id < 1 || empty($matches)) {
            $this->respond(404, ['status' => 'error', 'message' => 'Payment method not found.']);
            return;
        }

        $db->transaction();
        try {
            $db->table('taxpayer_payment_methods')
                ->where('user_id', $user['id'])
                ->update(['is_default' => 0]);
            $db->table('taxpayer_payment_methods')
                ->where('id', $method_id)
                ->where('user_id', $user['id'])
                ->update(['is_default' => 1]);
            $this->record_audit($db, $user, 'payment_method.default_changed', 'payment_method', $method_id);
            $db->commit();
        } catch (Throwable $error) {
            $db->roll_back();
            throw $error;
        }

        $this->respond(200, ['status' => 'success']);
    }

    public function delete_payment_method($id = 0) {
        $user = $this->require_user(['taxpayer']);
        if (!$user) return;

        $method_id = (int) $id;
        $this->call->database();
        $db = lava_instance()->db;
        $matches = $db->table('taxpayer_payment_methods')
            ->where('id', $method_id)
            ->where('user_id', $user['id'])
            ->get_all();
        $method = $matches[0] ?? null;
        if (!$method) {
            $this->respond(404, ['status' => 'error', 'message' => 'Payment method not found.']);
            return;
        }

        $db->transaction();
        try {
            $db->table('taxpayer_payment_methods')->where('id', $method_id)->delete();
            if ((int) $method['is_default'] === 1) {
                $remaining = $db->table('taxpayer_payment_methods')
                    ->where('user_id', $user['id'])
                    ->order_by('id', 'DESC')
                    ->get_all();
                if (!empty($remaining)) {
                    $db->table('taxpayer_payment_methods')
                        ->where('id', $remaining[0]['id'])
                        ->update(['is_default' => 1]);
                }
            }
            $this->record_audit($db, $user, 'payment_method.removed', 'payment_method', $method_id, [
                'provider' => $method['provider'],
                'account_last4' => $method['account_last4']
            ]);
            $db->commit();
        } catch (Throwable $error) {
            $db->roll_back();
            throw $error;
        }

        $this->respond(200, ['status' => 'success']);
    }

    public function get_audit_logs() {
        if (!$this->require_user(['admin'])) return;

        $this->call->database();
        $prefix = database_config()['main']['dbprefix'] ?? '';
        $statement = lava_instance()->db->raw(
            'SELECT id, actor_id, actor_email, action, entity, entity_id, details, ip_address, created_at ' .
            'FROM ' . $prefix . 'audit_logs ORDER BY id DESC LIMIT 250'
        );
        $this->respond(200, ['status' => 'success', 'data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function request_password_reset() {
        $input = $this->request_data();
        $email = strtolower(trim(is_string($input['email'] ?? null) ? $input['email'] : ''));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->respond(422, [
                'status' => 'error',
                'message' => 'Please enter a valid email address.'
            ]);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        $matches = $db->table('users')->where('email', $email)->get_all();
        
        if (!$matches) {
            $this->respond(200, [
                'status' => 'success',
                'message' => 'If your email is registered, a 6-digit OTP has been sent.'
            ]);
            return;
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $db->table('password_resets')->where('email', $email)->delete();
        $db->table('password_resets')->insert([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => $expires_at,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $apiKey = getenv('SENDGRID_API_KEY');
        if (empty($apiKey)) {
            $this->respond(500, [
                'status' => 'error',
                'message' => 'SendGrid API Key is missing or not loaded from .env.'
            ]);
            return;
        }

        $payload = json_encode([
            'personalizations' => [
                [
                    'to' => [['email' => $email]]
                ]
            ],
            'from' => [
                'email' => 'marianneumandal209@gmail.com', 
                'name' => 'MindoroPayLink Support'
            ],
            'subject' => 'MindoroPayLink - Password Reset OTP',
            'content' => [
                [
                    'type' => 'text/plain',
                    'value' => "Hello,\n\nYour One-Time Password (OTP) for password recovery is: {$otp}\n\nThis OTP will expire in 10 minutes.\nIf you did not request this, please ignore this email."
                ]
            ]
        ]);

        $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $this->respond(200, [
                'status' => 'success',
                'message' => 'A 6-digit OTP has been sent to your email.'
            ]);
        } else {
            error_log(
                'SendGrid password reset request failed (HTTP ' . $httpCode . '): ' .
                ($response === false ? $curlError : $response)
            );
            $this->respond(500, [
                'status' => 'error',
                'message' => 'Unable to send a password reset email right now. Please try again later.'
            ]);
        }
    }

    public function verify_otp() {
        $input = $this->request_data();
        $email = strtolower(trim(is_string($input['email'] ?? null) ? $input['email'] : ''));
        $otp = trim(is_string($input['otp'] ?? null) ? $input['otp'] : '');

        if (empty($email) || empty($otp)) {
            $this->respond(422, ['status' => 'error', 'message' => 'Email and OTP are required.']);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        
        $record = $db->table('password_resets')
                     ->where('email', $email)
                     ->where('otp', $otp)
                     ->get();

        if (!$record) {
            $this->respond(400, ['status' => 'error', 'message' => 'Invalid OTP code.']);
            return;
        }

        if (strtotime($record['expires_at']) < time()) {
            $this->respond(400, ['status' => 'error', 'message' => 'OTP has expired. Please request a new one.']);
            return;
        }

        $this->respond(200, ['status' => 'success', 'message' => 'OTP verified successfully. You may now reset your password.']);
    }

    public function reset_password() {
        $input = $this->request_data();
        $email = strtolower(trim(is_string($input['email'] ?? null) ? $input['email'] : ''));
        $otp = trim(is_string($input['otp'] ?? null) ? $input['otp'] : '');
        $new_password = $input['password'] ?? '';

        if (empty($email) || empty($otp) || empty($new_password)) {
            $this->respond(422, ['status' => 'error', 'message' => 'All fields are required.']);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;

        $record = $db->table('password_resets')
                     ->where('email', $email)
                     ->where('otp', $otp)
                     ->get();

        if (!$record || strtotime($record['expires_at']) < time()) {
            $this->respond(400, ['status' => 'error', 'message' => 'Invalid or expired OTP.']);
            return;
        }

        $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
        $db->table('users')->where('email', $email)->update(['password' => $hashed_password]);
        $db->table('password_resets')->where('email', $email)->delete();

        $this->respond(200, ['status' => 'success', 'message' => 'Password has been successfully reset.']);
    }

    public function get_transactions() {
        $user = $this->require_user(['taxpayer']);
        if (!$user) return;
        $this->call->database();
        $db = lava_instance()->db;

        $rows = $db
            ->table('transactions')
            ->where('taxpayer_id', $user['id']) // Naka-filter na sa kasalukuyang naka-log in!
            ->order_by('id', 'DESC')
            ->get_all();
        $ledger = $this->ledger_integrity($db);
        $rows = $this->annotate_ledger_rows(is_array($rows) ? $rows : [], $ledger);

        $this->respond(200, [
            'status' => 'success',
            'ledger' => [
                'valid' => $ledger['valid'],
                'entry_count' => $ledger['entry_count']
            ],
            'data' => $rows
        ]);
    }

    public function verify_ledger() {
        if (!$this->require_user(['taxpayer', 'admin', 'cashier'])) return;
        $this->call->database();
        $ledger = $this->ledger_integrity(lava_instance()->db);

        $this->respond(200, [
            'status' => 'success',
            'data' => [
                'valid' => $ledger['valid'],
                'entry_count' => $ledger['entry_count'],
                'head_hash' => $ledger['head_hash']
            ]
        ]);
    }

    public function get_all_transactions() {
        if (!$this->require_user(['admin', 'cashier'])) return;

        try {
            $this->call->database();
            $rows = lava_instance()->db
                ->table('transactions')
                ->select('transactions.id, transactions.e_or_number, transactions.taxpayer_id, transactions.tax_type, transactions.amount, transactions.payment_method, transactions.block_hash, transactions.created_at, taxpayer_profiles.full_name AS taxpayer_name')
                ->join('taxpayer_profiles', 'transactions.taxpayer_id = taxpayer_profiles.user_id', 'LEFT ')
                ->order_by('transactions.id', 'DESC')
                ->get_all();
            $ledger = $this->ledger_integrity(lava_instance()->db);
            $rows = $this->annotate_ledger_rows(is_array($rows) ? $rows : [], $ledger);

            $this->respond(200, [
                'status' => 'success',
                'ledger' => [
                    'valid' => $ledger['valid'],
                    'entry_count' => $ledger['entry_count']
                ],
                'data' => $rows
            ]);
        } catch (Throwable $e) {
            error_log('Unable to fetch transaction ledger: ' . $e->getMessage());
            $this->respond(500, [
                'status' => 'error',
                'message' => 'Unable to retrieve transaction records.'
            ]);
        }
    }

    public function process_payment() {
        $user = $this->require_user(['taxpayer', 'cashier']);
        if (!$user) return;
        $input = $this->request_data();
        $this->call->database();
        $db = lava_instance()->db;
        $amount = $input['amount'] ?? null;
        $tax_type = trim(is_string($input['tax_type'] ?? null) ? $input['tax_type'] : '');
        $payment_method = trim(is_string($input['payment_method'] ?? null) ? $input['payment_method'] : '');
        $queue_ticket_id = (int) ($input['queue_ticket_id'] ?? 0);
        $taxpayer_id = $user['role'] === 'taxpayer'
            ? (int) $user['id']
            : (int) ($input['taxpayer_id'] ?? 0);

        if (
            !is_numeric($amount)
            || !is_finite((float) $amount)
            || (float) $amount <= 0
            || round((float) $amount, 2) <= 0
            || $tax_type === ''
            || $payment_method === ''
            || $taxpayer_id < 1
        ) {
            $this->respond(422, ['status' => 'error', 'message' => 'Valid payment details are required.']);
            return;
        }
        $amount = number_format((float) $amount, 2, '.', '');

        $data = [
            'e_or_number' => 'eOR-OMP-' . date('Y') . '-' . random_int(100000, 999999),
            'taxpayer_id' => $taxpayer_id,
            'tax_type' => $tax_type,
            'amount' => $amount,
            'payment_method' => $payment_method,
            'block_hash' => str_repeat('0', 64),
            'created_at' => date('Y-m-d H:i:s')
        ];

        $db->transaction();
        try {
            $prefix = database_config()['main']['dbprefix'] ?? '';
            if ($user['role'] === 'cashier') {
                $claim = $db->raw(
                    'UPDATE ' . $prefix . 'queue_tickets SET status = ? ' .
                    'WHERE id = ? AND taxpayer_id = ? AND status <> ?',
                    ['Paid', $queue_ticket_id, $taxpayer_id, 'Paid']
                );
                if ($claim->rowCount() !== 1) {
                    $db->roll_back();
                    $this->respond(422, ['status' => 'error', 'message' => 'A valid unpaid queue ticket is required for counter payment.']);
                    return;
                }
            }

            $data['id'] = $db->table('transactions')->insert($data);
            $db->raw('UPDATE ' . $prefix . 'transaction_ledger_heads SET head_hash = head_hash WHERE id = 1');
            $heads = $db->table('transaction_ledger_heads')->where('id', 1)->get_all();
            if (empty($heads[0]['head_hash'])) {
                throw new RuntimeException('The transaction ledger is not initialized.');
            }
            $previous_hash = $heads[0]['head_hash'];
            $data['previous_hash'] = $previous_hash;
            $data['block_hash'] = $this->ledger_hash($data, $previous_hash);
            $db->table('transactions')->where('id', $data['id'])->update([
                'block_hash' => $data['block_hash']
            ]);
            $data['ledger_index'] = $db->table('transaction_ledger_entries')->insert([
                'transaction_id' => $data['id'],
                'previous_hash' => $previous_hash,
                'entry_hash' => $data['block_hash'],
                'created_at' => $data['created_at']
            ]);
            $db->table('transaction_ledger_heads')->where('id', 1)->update([
                'head_hash' => $data['block_hash']
            ]);
            $this->record_audit($db, $user, 'payment.recorded', 'transaction', $data['id'], [
                'e_or_number' => $data['e_or_number'],
                'taxpayer_id' => $taxpayer_id,
                'tax_type' => $tax_type,
                'amount' => $amount,
                'payment_method' => $payment_method
            ]);
            $db->commit();
        } catch (Throwable $error) {
            $db->roll_back();
            throw $error;
        }

        $this->respond(200, [
            'status' => 'success',
            'message' => 'Payment record saved successfully.',
            'data' => $data
        ]);
    }

    public function get_queue_tickets() {
        if (!$this->require_user(['admin', 'cashier'])) return;

        try {
            $this->call->database();
            $tickets = lava_instance()->db
                ->table('queue_tickets')
                ->where('status', '!=', 'Paid')
                ->order_by('id', 'DESC')
                ->get_all();

            $tickets = is_array($tickets) ? $tickets : [];

            foreach ($tickets as &$ticket) {
                $ticket['service_type'] = $ticket['tax_type'] ?? '';
                $ticket['taxpayer_name'] = ($ticket['taxpayer_name'] ?? '')
                    ?: 'Taxpayer #' . ($ticket['taxpayer_id'] ?? '');
            }
            unset($ticket);

            $this->respond(200, [
                'status' => 'success',
                'data' => $tickets
            ]);
        } catch (Throwable $e) {
            $this->respond(200, [
                'status' => 'success',
                'data' => []
            ]);
        }
    }

    public function update_queue_ticket() {
        if (!$this->require_user(['cashier'])) return;

        $input = $this->request_data();
        $ticket_id = (int) ($input['id'] ?? 0);
        $status = $input['status'] ?? '';
        $allowed_statuses = ['Waiting', 'Serving', 'Recalled', 'Transferred', 'Paid'];
        if ($ticket_id < 1 || !in_array($status, $allowed_statuses, true)) {
            $this->respond(422, ['status' => 'error', 'message' => 'A valid ticket ID and status are required.']);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        $tickets = $db->table('queue_tickets')->where('id', $ticket_id)->get_all();
        if (!$tickets) {
            $this->respond(404, ['status' => 'error', 'message' => 'Queue ticket not found.']);
            return;
        }
        $db->transaction();
        try {
            $db->table('queue_tickets')
                ->where('id', $ticket_id)
                ->update(['status' => $status]);
            $this->record_audit($db, $_SESSION['user'], 'queue_ticket.status_changed', 'queue_ticket', $ticket_id, [
                'previous_status' => $tickets[0]['status'],
                'status' => $status
            ]);
            $db->commit();
        } catch (Throwable $error) {
            $db->roll_back();
            throw $error;
        }

        $this->respond(200, ['status' => 'success']);
    }

    public function generate_queue_ticket() {
        $user = $this->require_user(['taxpayer']);
        if (!$user) return;
        
        $input = $this->request_data();
        
        $service_type = trim(is_string($input['service_type'] ?? null) ? $input['service_type'] : '');
        if ($service_type === '') {
            $service_type = trim(is_string($input['transaction_nature'] ?? null) ? $input['transaction_nature'] : '');
        }
        if ($service_type === '') {
            $service_type = trim(is_string($input['department'] ?? null) ? $input['department'] : '');
        }
        
        $taxpayer_id = (int) $user['id'];

        if ($service_type === '' || $taxpayer_id < 1) {
            $this->respond(422, [
                'status' => 'error',
                'message' => 'Service type and a valid taxpayer account are required.'
            ]);
            return;
        }

        $this->call->database();
        $db = lava_instance()->db;
        
        $profile = $this->profile_for_user($taxpayer_id);
        $taxpayer_name = trim($profile['full_name'] ?? '');
        if ($taxpayer_name === '') {
            $this->respond(422, ['status' => 'error', 'message' => 'Complete your taxpayer profile before requesting a queue ticket.']);
            return;
        }

        $prefix = 'RPT';
        if (stripos($service_type, 'Business') !== false || stripos($service_type, 'Biz') !== false) {
            $prefix = 'BIZ';
        } elseif (stripos($service_type, 'Treasurer') !== false || stripos($service_type, 'Verification') !== false) {
            $prefix = 'TRE';
        }

        $db->transaction();
        try {
            $existing_count = $db->table('queue_tickets')
                ->where('tax_type', $service_type)
                ->count();

            $ticket_number = $prefix . '-' . str_pad($existing_count + 1, 3, '0', STR_PAD_LEFT);

            $data = [
                'ticket_number' => $ticket_number,
                'taxpayer_id'   => $taxpayer_id,
                'taxpayer_name' => $taxpayer_name,
                'tax_type'      => $service_type,
                'status'        => 'Waiting',
                'created_at'    => date('Y-m-d H:i:s')
            ];

            $data['id'] = $db->table('queue_tickets')->insert($data);
            $data['service_type'] = $service_type;
            $this->record_audit($db, $user, 'queue_ticket.created', 'queue_ticket', $data['id'], [
                'service_type' => $service_type
            ]);
            $db->commit();

            $this->respond(201, [
                'status' => 'success',
                'message' => 'Virtual Queue Pass Generated Successfully!',
                'data' => $data
            ]);
        } catch (Throwable $e) {
            $db->roll_back();
            $this->respond(500, [
                'status' => 'error',
                'message' => 'Failed to generate queue ticket: ' . $e->getMessage()
            ]);
        }
    }
}