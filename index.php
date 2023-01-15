<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>SQLgarden</title>
    
    <script src="index.js" defer></script>
    <link rel="stylesheet" href="./index.css">
</head>
<body>
    <h1>Welcome to SQLgarden</h1>
    <form id="new-form" action="/sqlgarden/garden.php" method="post">
        <input type="text" name="gamename" placeholder="Game Name...">
        <input type="hidden" name="entermode" value="new">
        <input type="submit" value="Start New Game -->">
    </form>
    <form id="old-form" action="/sqlgarden/garden.php" method="post">
        <div id="chooser">
            <?php
                $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');
                foreach($pdo->query('SELECT name FROM games') as $row) {
                    echo '<input type="radio" id="'.$row['name'].'" name="gamechoice" value="'.$row['name'].'">';
                    echo '<label for="'.$row['name'].'">'.$row['name'].'</label>';
                }
            ?>
        </div>
        <input type="hidden" name="entermode" value="old">
        <input type="submit" value="Enter Game -->">
    </form>
</body>
</html>