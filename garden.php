<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>SQLgarden</title>
    <link rel="stylesheet" href="./garden.css">
    <script>
        <?php
            if ($_REQUEST["entermode"] == "new") {
                // create new game
            }
            $server_name='localhost';
            $username='root';
            $password='';
            $database_name='sqlgarden';

            $conn=mysqli_connect($server_name,$username,$password,$database_name);
            if (!$conn) {
                die('Connection failed');
            }
            $shopArrs = array();
        ?>

        const STATIC_DATA = {
            tools:
                <?php
                    $sql = 'SELECT * from tools;';
                    $result=mysqli_query($conn, $sql);
                    $toolsArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $toolsArr[] = $db_field;
                    }
                    $shopArrs[] = $toolsArr;
                    echo json_encode($toolsArr);
                ?>,

            boosters:
                <?php
                    $sql = 'SELECT * from boosters;';
                    $result=mysqli_query($conn, $sql);
                    $boostersArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $boostersArr[] = $db_field;
                    }
                    $shopArrs[] = $boostersArr;
                    echo json_encode($boostersArr);
                ?>,

            flowers:
                <?php
                    $sql = 'SELECT * from flowers;';
                    $result=mysqli_query($conn, $sql);
                    $flowersArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $flowersArr[] = $db_field;
                    }
                    $shopArrs[] = $flowersArr;
                    echo json_encode($flowersArr);
                ?>,

            buildings:
                <?php
                    $sql = 'SELECT * from buildings;';
                    $result=mysqli_query($conn, $sql);
                    $buildingsArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $buildingsArr[] = $db_field;
                    }
                    $shopArrs[] = $buildingsArr;
                    echo json_encode($buildingsArr);
                ?>,            
        }
        let gamestates = <?php
                $sql = 'SELECT * from gamestates;';
                $result=mysqli_query($conn, $sql);
                echo json_encode(mysqli_fetch_assoc($result));
            ?>
        
        Object.keys(gamestates).forEach(key=>{gamestates[key] = parseInt(gamestates[key])})
        let game_data = {
            awards:
                <?php
                    $sql = 'SELECT * from awards;';
                    $result=mysqli_query($conn, $sql);
                    $awardsArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $awardsArr[] = $db_field;
                    }
                    echo json_encode($awardsArr);
                ?>,

            shelf:
                <?php
                    $sql = 'SELECT * from shelf;';
                    $result=mysqli_query($conn, $sql);
                    $shelfArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $shelfArr[] = $db_field;
                    }
                    echo json_encode($shelfArr);
                ?>,

            tiles:
                <?php
                    $sql = 'SELECT * from tiles;';
                    $result=mysqli_query($conn, $sql);
                    $newArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $newArr[] = $db_field;
                    }
                    echo json_encode($newArr);
                ?>,

            builts:
                <?php
                    $sql = 'SELECT * from builts;';
                    $result=mysqli_query($conn, $sql);
                    $newArr = array();
                    while ($db_field = mysqli_fetch_assoc($result)) {
                        $newArr[] = $db_field;
                    }
                    echo json_encode($newArr);
                ?>,

            ...gamestates
        }

    </script>
    <script src="./garden.js"></script>
</head>
<body>
    <div id="top-bar">
        <div id="money-display"><span style="font-size:0.7em;">&#128176;</span> 50</div>
        <div id="shelf">
            <?php
            foreach ($flowersArr as $item) {
                echo('<div class="shelf-item hidden" id="shelf-'.$item["name"].'">');
                    echo('<img class="shelf-flower-img item-img" id="shelf-'.$item["name"].'-img" src="./images/items/'.$item["name"].'.gif">');
                    echo('<img class="seed-img item-img" src="./images/items/seed.gif">');
                    echo('<div class="item-title">'.$item["name"].'</div>');
                    echo('<div class="item-desc">'.$item["description"].'</div>');
                    echo('<div class="amount-btn" onclick="changeCurrentActionTo(\"shelf-'.$item["name"].'\")">'.$item["cost"].'</div>');
                echo('</div>');
            }
            ?>
        </div>
    </div>

    <div id="awards-hover">
        <div id="awards-hider">
            <div id="awards">
                <span id="awards-title">&#127942;    AWARDS</span>
                
            </div>
        </div>
    </div>
    
    <div id="canvas-container">
        <canvas id="backdrop-cvs"></canvas>
        <canvas id="scene-cvs"></canvas>
        <canvas id="animate-cvs"></canvas>
        <canvas id="ui-cvs"></canvas>
    </div>

	<div id="shop" onscroll="alterRadios();">
        <div id="nav-bar">
            <input id="tools-radio" type="radio" name="nav" value="tools"checked>
            <label for="tools" onclick="navTo('tools-header')">TOOLS</label>
            <input id="boosters-radio" type="radio" name="nav" value="boosters">
            <label for="boosters" onclick="navTo('boosters-header')">BOOSTERS</label>
            <input id="flowers-radio" type="radio" name="nav" value="flowers">
            <label for="flowers" onclick="navTo('flowers-header')">FLOWERS</label>
            <input id="buildings-radio" type="radio" name="nav" value="buildings">
            <label for="buildings" onclick="navTo('buildings-header')">BUILDINGS</label>
        </div>
        <div id="tools-header" class="shop-header">TOOLS</div>
        <div class="shop-item">
            <img src="./images/items/spade.gif">
            <div class="item-title">Ultimate Spade</div>
            <div class="item-desc">germprob +10%<br>prob -20%</div>
            <button class="buy-btn"><div>45</div></button>
        </div>

        <?php
            $shopHeaders = array("tools", "boosters", "flowers", "buildings");
            for ($i = 0; $i < 4; $i++) {
                echo('<div id="'.$shopHeaders[$i].'-header" class="shop-header">'.strtoupper($shopHeaders[$i]).'</div>');
                foreach ($shopArrs[$i] as $item) {
                    if (strpos($item["name"], "-builtboost") == false) {
                        echo("<div class='shop-item $shopHeaders[$i]-item' onmouseover='toggleItemHighlights(\"".$item['name']."\")' onmouseout='toggleItemHighlights()'>");
                            echo('<img class="shop-img item-img" id="shop-'.$item["name"].'" src="./images/items/'.$item["name"].'.gif">');
                            if ($shopHeaders[$i] == "flowers") {
                                echo('<img class="seed-img item-img" src="./images/items/seed.gif">');
                            }
                            echo('<div class="item-title">'.$item["name"].'</div>');
                            echo('<div class="item-desc">'.$item["description"].'</div>');
                            switch ($shopHeaders[$i]) {
                                case "flowers":
                                    echo("<button class='buy-btn buy-flower-btn' onclick='changeCurrentActionTo(\"flower-".$item["name"]."\")'><div>".$item["cost"]."</div></button>");
                                    echo("<button class='buy-btn buy-seed-btn' onclick='changeCurrentActionTo(\"seed-".$item["name"]."\")'><div>".$item["cost"]."</div></button>");
                                    break;
                                case "tools":
                                    echo("<button class='use-btn' onclick='changeCurrentActionTo(\"".$item["name"]."\")'>USE</button>");
                                    break;
                                default:
                                    echo("<button class='buy-btn' onclick='changeCurrentActionTo(\"".$item["name"]."\")'><div>".$item["cost"]."</div></button>");
                                    break;
                            }
                            
                        echo('</div>');
                    }
                }
            }
            
        ?>
        
    </div>

    <div id="season-bar">
        <div id="season-marker"></div>
        <div class="skip-btn winter-skip winter-skip-left" onclick="skipToSeason(event)"></div>
        <div class="skip-btn spring-skip" onclick="skipToSeason(event)">SPRING</div>
        <div class="skip-btn summer-skip" onclick="skipToSeason(event)">SUMMER</div>
        <div class="skip-btn autumn-skip activeseason" onclick="skipToSeason(event)">AUTUMN</div>
        <div class="skip-btn winter-skip winter-skip-right" onclick="skipToSeason(event)">WINTER</div>
        <div class="skip-btn winter-skip winter-skip-right-left" onclick="skipToSeason(event)"></div>
    </div>
    <div class="popup" onclick="event.stopPropagation();event.currentTarget.classList.remove('opened');">
        <div id="tile-info"></div>
        <div id="tile-info-bottom"></div>
    </div>
    <div id="images" style="display:none;">
        <img src="images/grass.gif" id="backdrop-season-0">;
        <img src="images/grass.gif" id="backdrop-season-1">;
    </div>
</body>
</html>