<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Product</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #fff5f5; /* Light red/pink background */
            margin: 0;
            padding: 40px;
            color: #1e293b;
        }

        .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.10);
            border: 1px solid #fee2e2;
        }

        h1 {
            margin-top: 0;
            margin-bottom: 25px;
            text-align: center;
            color: #991b1b; /* Dark red para sa pamagat */
            font-size: 30px;
            font-weight: 700;
        }

        label {
            display: block;
            margin-bottom: 6px;
            font-weight: bold;
            color: #991b1b;
        }

        input,
        textarea {
            width: 100%;
            padding: 10px;
            margin-bottom: 18px;
            border: 1px solid #fecaca;
            border-radius: 6px;
            font-size: 14px;
            background: #ffffff;
            color: #1e293b;
            outline: none;
            transition: 0.2s;
        }

        input:focus,
        textarea:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.10);
        }

        input::placeholder,
        textarea::placeholder {
            color: #94a3b8;
        }

        textarea {
            min-height: 120px;
            resize: vertical;
        }

        .buttons {
            display: flex;
            gap: 10px;
            margin-top: 3px;
        }

        button {
            border: none;
            padding: 11px 18px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: 0.2s;
        }

        .update-btn {
            background: #dc2626; /* Vibrant red */
            color: white;
        }

        .update-btn:hover {
            background: #b91c1c; /* Darker red kapag hinohover */
        }

        .back-btn {
            background: #ffffff;
            color: #dc2626;
            text-decoration: none;
            padding: 11px 18px;
            border-radius: 6px;
            border: 1px solid #fecaca;
            font-weight: 600;
            display: inline-block;
            text-align: center;
            transition: 0.2s;
        }

        .back-btn:hover {
            background: #fee2e2; /* Light red/pink background kapag hinohover */
            border-color: #f87171;
        }
    </style>
</head>

<body>

<div class="container">

    <h1>Edit Product</h1>

    <form action="<?= site_url('products/update/' . $product['id']); ?>" method="POST">

        <label>Product Name</label>
        <input type="text" name="product_name" value="<?= htmlspecialchars($product['product_name']); ?>" placeholder="Enter product name" required>

        <label>Description</label>
        <textarea name="description" placeholder="Enter product description" required><?= htmlspecialchars($product['description']); ?></textarea>

        <label>Price</label>
        <input type="number" name="price" step="0.01" min="0" value="<?= htmlspecialchars($product['price']); ?>" placeholder="0.00" required>

        <label>Quantity</label>
        <input type="number" name="quantity" min="0" value="<?= htmlspecialchars($product['quantity']); ?>" placeholder="Enter quantity" required>

        <div class="buttons">
            <button type="submit" class="update-btn">Update Product</button>
            <a href="<?= site_url('products'); ?>" class="back-btn">Back</a>
        </div>

    </form>

</div>

</body>
</html>