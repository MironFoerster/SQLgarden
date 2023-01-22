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
    <img id="logo" src="./images/logo.png" alt="">
    <form action="/sqlgarden/garden.php" method="post">
        <input type="submit" id="submit-choice" value="Enter Game" disabled>
        <div id="choose-hover">
        <input type="text" id="gamename-input" name="gamename" placeholder="Choose Game..." maxlength="20" readonly>
            <div id="chooser">
                <?php
                    echo "<input type='radio' id='new-game' name='gamechoice' value='new-game'>\n";
                    echo "<label for='new-game'>+ New Game</label>\n";
                    $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');
                    foreach($pdo->query('SELECT name FROM games') as $row) {
                        echo "<input type='radio' id='".$row['name']."' name='gamechoice' value='".$row['name']."'>\n";
                        echo "<label for='".$row['name']."'>".$row['name']."</label>\n";
                    }
                ?>
            </div>
        </div>
    </form>
    
</body>
</html>