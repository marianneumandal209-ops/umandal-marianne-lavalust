<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title ?? 'Student Profile'); ?></title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #4a1525;
            background: linear-gradient(135deg, #ffeef3 0%, #fff0f5 55%, #ffd6e0 100%);
        }

        /* BAGONG TOPBAR DESIGN (KULAY AT BUTTON STYLE) */
        .topbar { 
            background: rgba(216, 27, 96, 0.95); 
            backdrop-filter: blur(8px);
            color: white; 
            box-shadow: 0 4px 15px rgba(216, 27, 96, 0.2); 
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .nav {
            width: min(980px, calc(100% - 32px));
            margin: 0 auto;
            min-height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
        }
        .brand { 
            font-size: 19px; 
            font-weight: 800; 
            letter-spacing: .5px;
            text-transform: uppercase;
        }
        .nav a {
            color: #fff;
            text-decoration: none;
            border: 1px solid rgba(255,255,255,.4);
            padding: 9px 18px;
            border-radius: 20px;
            background: #c2185b;
            font-weight: 700;
            transition: all 0.25s ease;
        }
        .nav a:hover {
            background: #ffffff;
            color: #d81b60;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .page { width: min(980px, calc(100% - 32px)); margin: 0 auto; padding: 44px 0 58px; }
        .profile-card {
            overflow: hidden;
            background: #fff;
            border: 1px solid #ffccd5;
            border-radius: 24px;
            box-shadow: 0 20px 55px rgba(216, 27, 96, .12);
        }
        .hero {
            padding: 32px 34px;
            color: #fff;
            background: linear-gradient(120deg, #c2185b, #d81b60 58%, #ff4081);
        }
        .badge {
            display: inline-block;
            margin-bottom: 13px;
            padding: 7px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.35);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .3px;
        }
        h1 { margin: 0 0 7px; font-size: clamp(28px, 4vw, 42px); }
        .course-line { margin: 0; opacity: .95; font-weight: 600; }
        .content { padding: 30px 34px 35px; }
        .middleware {
            margin-bottom: 24px;
            padding: 15px 17px;
            border-radius: 12px;
            background: #fff0f3;
            border: 1px solid #ffb3c1;
            border-left: 5px solid #c2185b;
            color: #800f2f;
            font-weight: 700;
            line-height: 1.5;
        }

        /* PA-DIRETSO (SINGLE COLUMN) NA DETAILS LAYOUT */
        .details {
            display: flex;
            flex-direction: column; /* Ginagawang sunod-sunod pababa */
            gap: 14px;
        }
        .item {
            padding: 18px 22px;
            border-radius: 14px;
            border: 1px solid #ffccd5;
            background: #fff5f7;
            transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }

        /* HOVER EFFECT (TULAD NG SA HOME) */
        .item:hover {
            transform: translateX(6px);
            background: #ffffff;
            border-color: #ff80ab;
            box-shadow: 0 8px 20px rgba(216, 27, 96, 0.15);
        }

        .label {
            display: block;
            margin-bottom: 4px;
            color: #b71c1c;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .8px;
            opacity: 0.75;
        }
        .value { display: block; color: #590d22; font-weight: 800; line-height: 1.45; word-break: break-word; font-size: 16px; }
        .value a { color: #d81b60; text-decoration: none; font-weight: 800; }
        .value a:hover { text-decoration: underline; color: #880e4f; }

        @media (max-width: 680px) {
            .page { padding-top: 28px; }
            .hero, .content { padding: 24px 20px; }
        }
    </style>
</head>
<body>
    <header class="topbar">
        <nav class="nav">
            <div class="brand">Student Information Hub</div>
            <a href="<?= site_url('student'); ?>">Home</a>
        </nav>
    </header>

    <main class="page">
        <section class="profile-card">
            <div class="hero">
                <span class="badge">Protected Profile · StudentMiddleware Verified</span>
                <h1><?= htmlspecialchars($name ?? ''); ?></h1>
                <p class="course-line">
                    <?= htmlspecialchars($course ?? ''); ?> · 
                    <?= htmlspecialchars($year ?? ''); ?> · 
                    Section <?= htmlspecialchars($section ?? ''); ?>
                </p>
            </div>

            <div class="content">
                <?php if (!empty($middleware_message)): ?>
                    <div class="middleware"><?= htmlspecialchars($middleware_message, ENT_QUOTES, 'UTF-8'); ?></div>
                <?php endif; ?>

                <!-- PA-DIRETSO / SUNOD-SUNOD PABABA NA DETAILS -->
                <div class="details">
                    <div class="item"><span class="label">Student ID</span><span class="value"><?= htmlspecialchars($student_id ?? ''); ?></span></div>
                    <div class="item"><span class="label">Student Name</span><span class="value"><?= htmlspecialchars($name ?? ''); ?></span></div>
                    <div class="item"><span class="label">Birthday</span><span class="value"><?= htmlspecialchars($birthday ?? ''); ?></span></div>
                    <div class="item"><span class="label">Age</span><span class="value"><?= htmlspecialchars($age ?? ''); ?></span></div>
                    <div class="item"><span class="label">Course</span><span class="value"><?= htmlspecialchars($course ?? ''); ?></span></div>
                    <div class="item"><span class="label">Year Level</span><span class="value"><?= htmlspecialchars($year ?? ''); ?></span></div>
                    <div class="item"><span class="label">Section</span><span class="value"><?= htmlspecialchars($section ?? ''); ?></span></div>
                    <div class="item"><span class="label">Email</span><span class="value"><?= htmlspecialchars($email ?? ''); ?></span></div>
                    <div class="item"><span class="label">Address</span><span class="value"><?= htmlspecialchars($address ?? ''); ?></span></div>
                    <div class="item"><span class="label">Contact Number</span><span class="value"><?= htmlspecialchars($contact ?? ''); ?></span></div>
                </div>
            </div>
        </section>
    </main>
</body>
</html>