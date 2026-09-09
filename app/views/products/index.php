<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Management</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #fff5f5; /* Malambot na light red/pink background */
            margin: 0;
            padding: 40px;
            color: #1e293b;
        }

        .container {
            max-width: 1100px;
            margin: auto;
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.10);
            border: 1px solid #fee2e2;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }

        h1 {
            margin: 0;
            color: #991b1b; /* Dark red para sa pamagat */
            font-size: 30px;
            font-weight: 700;
        }

        .add-btn {
            background: #dc2626; /* Vibrant red button */
            color: white;
            padding: 11px 18px;
            text-decoration: none;
            border-radius: 7px;
            font-weight: bold;
            transition: 0.2s;
        }

        .add-btn:hover {
            background: #b91c1c; /* Mas madilim na pulang kulay pagka-hover */
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #fee2e2;
            border-radius: 8px;
        }

        th,
        td {
            padding: 14px 12px;
            border-bottom: 1px solid #f1f5f9;
            text-align: left;
        }

        th {
            background: #fef2f2; /* Light red background para sa table header */
            color: #991b1b;
            font-weight: 700;
            border-bottom: 2px solid #fecaca;
        }

        tbody tr:hover {
            background: #fff8f8; /* Banayad na red tint sa bawat row pagka-hover */
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        td:last-child {
            white-space: nowrap;
            width: 150px;
        }

        .edit-btn,
        .delete-btn {
            display: inline-block;
            padding: 8px 13px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            margin-right: 6px;
            vertical-align: middle;
            transition: 0.2s;
        }

        .edit-btn {
            background: #dc2626; /* Red tone para sa Edit button */
            color: white;
        }

        .edit-btn:hover {
            background: #b91c1c;
        }

        .delete-btn {
            background: #ffffff;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        .delete-btn:hover {
            background: #fee2e2; /* Pulang background kapag in-hover ang delete */
            border-color: #f87171;
        }

        .empty {
            text-align: center;
            padding: 25px;
            color: #64748b;
        }
    </style>
</head>

<body>

<div class="container">

    <div class="header">
        <h1>Product Management</h1>
        <a href="<?= site_url('products/create'); ?>" class="add-btn">
            + Add Product
        </a>
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Actions</th>
            </tr>
        </thead>

        <tbody>
        <?php if (!empty($products)): ?>
            <?php foreach ($products as $product): ?>
                <tr>
                    <td>
                        <?= htmlspecialchars($product['id']); ?>
                    </td>
                    <td>
                        <?= htmlspecialchars($product['product_name']); ?>
                    </td>
                    <td>
                        <?= htmlspecialchars($product['description']); ?>
                    </td>
                    <td>
                        ₱<?= number_format($product['price'], 2); ?>
                    </td>
                    <td>
                        <?= htmlspecialchars($product['quantity']); ?>
                    </td>
                    <td>
                        <!-- EDIT -->
                        <a href="<?= site_url('products/edit/' . $product['id']); ?>" class="edit-btn">
                            Edit
                        </a>

                        <!-- DELETE -->
                        <a href="<?= site_url('products/delete/' . $product['id']); ?>" class="delete-btn" onclick="return confirm('Are you sure you want to delete this product?');">
                            Delete
                        </a>
                    </td>
                </tr>
            <?php endforeach; ?>
        <?php else: ?>
            <tr>
                <td colspan="6" class="empty">
                    No products found.
                </td>
            </tr>
        <?php endif; ?>
        </tbody>
    </table>

</div>

</body>

</html>