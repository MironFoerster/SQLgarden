<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>SQLgarden</title>
    <link rel="stylesheet" href="./menu.css">
</head>
<body>
    <h1>Welcome to SQLgarden</h1>^
    <form action="/sqlgarden/garden.php" method="post">
        <input type="text" name="gamename" placeholder="Start New Game...">
        <input type="hidden" name="entermode" value="new">
        <input type="submit" value=">">
    </form>
    <form action="/sqlgarden/garden.php" method="post">
        <?php
            $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');
            foreach($pdo->query('SELECT name FROM gamestates') as $row) {
                echo '<input type="radio" name="gamechoice" value="'.$row['name'].'">';
                echo '<label for="'.$row['name'].'">'.$row['name'].'</label>';
            }
        ?>
        <input type="hidden" name="entermode" value="old">
        <input type="submit" value="Enter Game">
    </form>
</body>
</html>