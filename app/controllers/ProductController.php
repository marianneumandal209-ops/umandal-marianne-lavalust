<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class ProductController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        // CORS Headers para sa Product API endpoints
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $this->call->library('session');
        $this->call->model('ProductModel');
        $this->call->helper('url');
    }

    // GET: Display all products as JSON
    public function index()
    {
        $products = $this->ProductModel->get_all();
        
        header('Content-Type: application/json');
        echo json_encode($products);
        exit();
    }

    // POST: Store a new product from JSON input
    public function create()
    {
        $input = json_decode(trim(file_get_contents('php://input')), true);

        $data = [
            'product_name' => $input['product_name'] ?? $input['name'] ?? $this->io->post('product_name'),
            'price'        => $input['price'] ?? $this->io->post('price'),
            'quantity'     => $input['quantity'] ?? $this->io->post('quantity')
        ];

        $this->ProductModel->insert($data);

        header('Content-Type: application/json');
        echo json_encode(['status' => true, 'message' => 'Product created successfully']);
        exit();
    }

    // PUT/PATCH: Update product by ID from JSON input
    public function update($id)
    {
        $input = json_decode(trim(file_get_contents('php://input')), true);

        $data = [
            'product_name' => $input['product_name'] ?? $input['name'] ?? $this->io->post('product_name'),
            'price'        => $input['price'] ?? $this->io->post('price'),
            'quantity'     => $input['quantity'] ?? $this->io->post('quantity')
        ];

        $this->ProductModel->update($id, $data);

        header('Content-Type: application/json');
        echo json_encode(['status' => true, 'message' => 'Product updated successfully']);
        exit();
    }

    // DELETE: Delete product by ID
    public function delete($id)
    {
        $this->ProductModel->delete($id);

        header('Content-Type: application/json');
        echo json_encode(['status' => true, 'message' => 'Product deleted successfully']);
        exit();
    }
}