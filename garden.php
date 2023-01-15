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
            $gamename = $_REQUEST["gamename"];
            
            $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');

            $shopArrs = array();
        ?>

        const STATIC_DATA = {
            awards:
                <?php
                    $pdostmt = $pdo->query('SELECT * from awards');
                    $awardsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs[] = $awardsArr;
                    echo json_encode($awardsArr);
                ?>,

            tools:
                <?php
                    $pdostmt = $pdo->query('SELECT * from tools');
                    $toolsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs[] = $toolsArr;
                    echo json_encode($toolsArr);
                ?>,

            boosters:
                <?php
                    $pdostmt = $pdo->query('SELECT * from boosters');
                    $boostersArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs[] = $boostersArr;
                    echo json_encode($boostersArr);
                ?>,

            flowers:
                <?php
                    $pdostmt = $pdo->query('SELECT * from flowers');
                    $flowersArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs[] = $flowersArr;
                    echo json_encode($flowersArr);
                ?>,

            buildings:
                <?php
                    $pdostmt = $pdo->query('SELECT * from buildings');
                    $buildingsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs[] = $buildingsArr;
                    echo json_encode($buildingsArr);
                ?>,            
        }
        
        //Object.keys(gamestates).forEach(key=>{gamestates[key] = parseInt(gamestates[key])})
        let game_data = {
            awards:
                <?php
                    $pdostmt = $pdo->prepare('SELECT * from awarded WHERE gamename = ?');
                    $pdostmt->execute(array($gamename));
                    $awardedArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode($awardsArr);
                ?>,

            shelf:
                <?php
                    $pdostmt = $pdo->prepare('SELECT * from shelf WHERE gamename = ?');
                    $pdostmt->execute(array($gamename));
                    $shelfArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode($shelfArr);
                ?>,

            tiles:
                <?php
                    $pdostmt = $pdo->prepare('SELECT * from tiles WHERE gamename = ?');
                    $pdostmt->execute(array($gamename));
                    $tilesArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode($tilesArr);
                ?>,

            builts:
                <?php
                    $pdostmt = $pdo->prepare('SELECT * from builts WHERE gamename = ?');
                    $pdostmt->execute(array($gamename));
                    $builtArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode($builtArr);
                ?>,

            ...<?php
                $pdostmt = $pdo->prepare('SELECT * from games WHERE name = ?');
                $pdostmt->execute(array($gamename));
                $gamestateArr = $pdostmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode($gamestateArr);
            ?>
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