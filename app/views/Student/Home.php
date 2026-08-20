<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title); ?></title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #4a1525;
            background: linear-gradient(135deg, #ffeef3 0%, #fff0f5 48%, #ffd6e0 100%);
        }

        /* BAGONG TOPBAR DESIGN */
        .topbar {
            background: rgba(216, 27, 96, 0.95);
            backdrop-filter: blur(8px);
            color: #fff;
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
        .nav-links { display: flex; align-items: center; gap: 10px; }
        .home-link {
            color: #fff;
            text-decoration: none;
            border: 1px solid rgba(255,255,255,.4);
            padding: 9px 16px;
            border-radius: 20px;
            background: #c2185b;
            font-weight: 700;
            transition: all 0.25s ease;
        }
        .profile-link {
            color: #fff;
            text-decoration: none;
            border: 1px solid rgba(255,255,255,.3);
            padding: 9px 16px;
            border-radius: 20px;
            background: transparent;
            font-weight: 700;
            transition: all 0.25s ease;
        }
        .home-link:hover, .profile-link:hover {
            background: #ffffff;
            color: #d81b60;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .page {
            width: min(980px, calc(100% - 32px));
            margin: 0 auto;
            padding: 46px 0 56px;
        }
        .card {
            background: #ffffff;
            border: 1px solid #ffccd5;
            border-radius: 24px;
            padding: 34px;
            box-shadow: 0 20px 55px rgba(216, 27, 96, .12);
        }

        /* BAGONG AVATAR DESIGN */
        .heading {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 28px;
        }
        .avatar {
            width: 75px;
            height: 75px;
            border-radius: 50%; /* BAGONG HURIS / BILOG NA AVATAR */
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 22px;
            font-weight: 900;
            background: linear-gradient(135deg, #ff4081, #d81b60);
            box-shadow: 0 0 0 4px #ffeef3, 0 8px 20px rgba(216, 27, 96, 0.35);
            transition: transform 0.3s ease;
        }
        .avatar:hover {
            transform: scale(1.08) rotate(-4deg);
        }

        h1 { margin: 0 0 6px; color: #880e4f; font-size: clamp(28px, 4vw, 42px); }
        .subtitle { margin: 0; color: #ad1457; line-height: 1.5; opacity: 0.8; }
        .notice {
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

        /* INFO GRID: PADIRETSO / SINGLE COLUMN LAYOUT */
        .info-grid {
            display: flex;
            flex-direction: column; /* Ginawang pa-diretso pabalaba */
            gap: 14px;
            margin-bottom: 26px;
        }
        .info {
            background: #fff5f7;
            border: 1px solid #ffccd5;
            border-radius: 14px;
            padding: 18px 22px;
            transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }

        /* PINATIBAY NA HOVER EFFECT */
        .info:hover {
            transform: translateX(6px); /* Nakatutok at umausog pakanan */
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
        .value { color: #590d22; font-size: 16px; font-weight: 800; word-break: break-word; }

        .button {
            display: inline-block;
            text-decoration: none;
            color: #fff;
            background: linear-gradient(135deg, #e91e63, #ff4081);
            padding: 14px 24px;
            border-radius: 12px;
            font-weight: 800;
            box-shadow: 0 9px 20px rgba(233, 30, 99, .32);
            transition: all 0.3s ease;
        }
        .button:hover { 
            background: linear-gradient(135deg, #c2185b, #e91e63);
            box-shadow: 0 12px 24px rgba(233, 30, 99, .45);
            transform: translateY(-2px);
        }
        .note { margin: 17px 0 0; color: #a24857; font-size: 13px; line-height: 1.55; }

        @media (max-width: 680px) {
            .page { padding-top: 28px; }
            .card { padding: 24px 20px; }
            .heading { align-items: flex-start; }
        }
    </style>
</head>
<body>
    <header class="topbar">
        <nav class="nav">
            <div class="brand">Student Portal</div>
            <div class="nav-links">
                <a class="home-link" href="<?= site_url('student'); ?>">Home</a>
                <a class="profile-link" href="<?= site_url('student/profile'); ?>">Student Profile</a>
            </div>
        </nav>
    </header>

    <main class="page">
        <section class="card">
            <div class="heading">
                <div class="avatar">SP</div>
                <div>
                    <h1>Student Portal</h1>
                    <p class="subtitle">WebSys · Laboratory Exercise No. 3</p>
                </div>
            </div>

            <?php if (!empty($notice)): ?>
                <div class="notice"><?= htmlspecialchars($notice, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>

            <!-- PA-DIRETSO (SINGLE COLUMN) NA INFO CARDS -->
            <div class="info-grid">
                <div class="info"><span class="label">Student ID</span><span class="value"><?= htmlspecialchars($student_id); ?></span></div>
                <div class="info"><span class="label">Student Name</span><span class="value"><?= htmlspecialchars($name); ?></span></div>
                <div class="info"><span class="label">Course</span><span class="value"><?= htmlspecialchars($course); ?></span></div>
                <div class="info"><span class="label">Year Level</span><span class="value"><?= htmlspecialchars($year); ?></span></div>
                <div class="info"><span class="label">Section</span><span class="value"><?= htmlspecialchars($section); ?></span></div>
                <div class="info"><span class="label">Email</span><span class="value"><?= htmlspecialchars($email); ?></span></div>
            </div>

            <a class="button" href="<?= site_url('student/open-profile'); ?>">Open Protected Profile</a>
        </section>
    </main>
</body>
</html>