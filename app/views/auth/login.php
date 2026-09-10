<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body { 
            font-family: Arial, sans-serif; 
            background-color: #fff5f5; /* Light red/pink background */
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            color: #1e293b;
        }

        .login-card { 
            background: white; 
            padding: 35px; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.10); 
            width: 100%;
            max-width: 360px;
            border: 1px solid #fee2e2;
        }

        .login-card h2 { 
            text-align: center; 
            color: #991b1b; /* Dark red para sa pamagat */
            margin-top: 0;
            margin-bottom: 25px; 
            font-size: 28px;
            font-weight: 700;
        }

        .form-group { 
            margin-bottom: 18px; 
        }

        .form-group label { 
            display: block; 
            margin-bottom: 6px; 
            color: #991b1b; 
            font-weight: bold;
            font-size: 14px;
        }

        .form-group input { 
            width: 100%; 
            padding: 10px; 
            box-sizing: border-box; 
            border: 1px solid #fecaca; 
            border-radius: 6px; 
            font-size: 14px;
            background: #ffffff;
            color: #1e293b;
            outline: none;
            transition: 0.2s;
        }

        .form-group input:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.10);
        }

        .btn { 
            width: 100%; 
            background-color: #dc2626; /* Vibrant red */
            color: white; 
            border: none; 
            padding: 12px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 15px; 
            font-weight: bold;
            transition: 0.2s;
            margin-top: 5px;
        }

        .btn:hover { 
            background-color: #b91c1c; /* Darker red kapag hinohover */
        }

        .error { 
            background: #fee2e2;
            color: #991b1b; 
            font-size: 14px; 
            text-align: center; 
            margin-bottom: 18px; 
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #fecaca;
        }
    </style>
</head>
<body>

<div class="login-card">
    <h2>Login</h2>
    
    <?php if (isset($error)): ?>
        <div class="error"><?= $error; ?></div>
    <?php endif; ?>

    <form action="https://umandal-marianne.onrender.com/auth/authenticate" method="POST">
        <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" placeholder="Enter username" required>
        </div>
        <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter password" required>
        </div>
        <button type="submit" class="btn">Login</button>
    </form>
</div>

</body>
</html>