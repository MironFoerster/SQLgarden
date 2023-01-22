<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>SQLgarden</title>
    <link rel="stylesheet" href="./garden.css">
    <script>
        <?php
            $ch = $_REQUEST["gamechoice"];
            $gamename = $_REQUEST["gamename"];
            
            $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');

            if ($_REQUEST["gamechoice"] == "new-game") {
                $pdostmt = $pdo->prepare('INSERT INTO games (name, money, elapsedtime) VALUES (:name, 0, 0)');
                $pdostmt->execute(array('name'=>$gamename));
            }

            $shopArrs = array();
        ?>

        const STATIC_DATA = {
            awards:
                <?php
                    $pdostmt = $pdo->query('SELECT * from awards');
                    $awardsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode($awardsArr);
                ?>,

            tools:
                <?php
                    $pdostmt = $pdo->query('SELECT * from tools');
                    $toolsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["tools"] = $toolsArr;
                    echo json_encode($toolsArr);
                ?>,

            boosters:
                <?php
                    $pdostmt = $pdo->query('SELECT * from boosters');
                    $boostersArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["boosters"] = $boostersArr;
                    echo json_encode($boostersArr);
                ?>,

            flowers:
                <?php
                    $pdostmt = $pdo->query('SELECT * from flowers');
                    $flowersArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["flowers"] = $flowersArr;
                    echo json_encode($flowersArr);
                ?>,

            buildings:
                <?php
                    $pdostmt = $pdo->query('SELECT * from buildings');
                    $buildingsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["buildings"] = $buildingsArr;
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
        console.log("game_data");
        console.log(game_data);

    </script>
    <script src="./garden.js"></script>
</head>
<body>
    <div id="top-bar">
        <div id="money-display"><span style="font-size:0.7em;">&#128176;</span> 50</div>
        <div id="shelf">
            <?php
            foreach ($flowersArr as $item) {
                $name = $item["name"];
                $desc = $item["description"];
                $cost = $item["cost"];
                echo("<div class='shelf-item hidden' id='shelf-$name'>
                <img class='shelf-flower-img item-img' id='shelf-$name-img' src='./images/items/$name.png'>
                <img class='seed-img item-img' src='./images/items/seed.png'>
                <div class='item-title'>$name</div>
                <div class='item-desc'>$desc</div>
                <div class='amount-btn' onclick='changeCurrentActionTo(\"shelf-$name\")'>$cost</div>
                </div>");
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
        <?php
            foreach ($shopArrs["tools"] as $tool) {
                echo(
                    "<div class='tool-shop-item'>
                    <img src='./images/items/{$tool["name"]}.png'>
                    </div>"
                );
            }

            $shopSections = array("boosters", "flowers", "buildings");
            foreach ($shopSections as $section) {
                echo('<div id="'.$section.'-header" class="shop-header">'.strtoupper($section).'</div>');
                foreach ($shopArrs[$section] as $item) {
                    $name = $item["name"];
                    $desc = $item["description"];
                    echo("<div class='shop-item $section-item' onmouseover='toggleItemHighlights(\"$name\")' onmouseout='toggleItemHighlights()'>
                            <img class='shop-img item-img' id='shop-$name' src='./images/items/$name.png'>
                            <div class='item-title'>$name</div>
                            <div class='item-desc'>$desc</div>");
                        if ($section == "flowers") {
                                echo("<button class='buy-btn buy-flower-btn' onclick='changeCurrentActionTo(\"flower-$name\")'><div>{$item["cost"]}</div></button>
                                <button class='buy-btn buy-seed-btn' onclick='changeCurrentActionTo(\"seed-$name\")'><div>{$item["cost"]}</div></button>");
                        } else {
                                echo("<button class='buy-btn' onclick='changeCurrentActionTo(\"$name\")'><div>{$item["cost"]}</div></button>");
                        }
                        
                    echo('</div>');
                    
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
        <img src="images/grass.jfif" id="backdrop-season-0">;
        <img src="images/grass.jfif" id="backdrop-season-1">;
    </div>
</body>
</html>