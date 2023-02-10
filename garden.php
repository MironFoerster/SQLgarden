<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>SQLgarden</title>
    <link rel="stylesheet" href="./garden.css">
    <script src="./game.js"></script>
    <script>
        <?php
            $ch = $_REQUEST["gamechoice"];
            $gamename = $_REQUEST["gamename"];
            
            $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');

            if ($_REQUEST["gamechoice"] == "new-game") {
                $pdostmt = $pdo->prepare('INSERT INTO games (name, money, elapsedweeks) VALUES (:name, 0, 0)');
                $pdostmt->execute(array('name'=>$gamename));
            }

            $shopArrs = array();
        ?>

        const STATIC_DATA = {
            decos:
                <?php
                    $pdostmt = $pdo->query('SELECT * from decos');
                    $decosArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode($decosArr);
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
                    $pdostmt = $pdo->query('SELECT * from boosters ORDER BY boosters.price ASC');
                    $boostersArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["boosters"] = $boostersArr;
                    echo json_encode($boostersArr);
                ?>,

            flowers:
                <?php
                    $pdostmt = $pdo->query('SELECT * from flowers ORDER BY flowers.price ASC');
                    $flowersArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["flowers"] = $flowersArr;
                    echo json_encode($flowersArr);
                ?>,

            buildings:
                <?php
                    $pdostmt = $pdo->query('SELECT * from buildings ORDER BY buildings.price ASC');
                    $buildingsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["buildings"] = $buildingsArr;
                    echo json_encode($buildingsArr);
                ?>,            
        }
        
        //Object.keys(gamestates).forEach(key=>{gamestates[key] = parseInt(gamestates[key])})
        let game_data = {
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
                    $tilesArr = array_map(function($tile) {$tile["boosters"] = json_decode($tile["boosters"]); return $tile;}, $tilesArr);
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

                $gamestateArr["money"] = intval($gamestateArr["money"]);
                $gamestateArr["elapsedweeks"] = intval($gamestateArr["elapsedweeks"]);
                echo json_encode($gamestateArr);
            ?>
        }

    </script>
</head>
<body>
    <div id="top-bar">
        <div id="money-display"><span style="font-size:0.7em;"></span> 50</div>
        <div id="shelf">
            <?php
            foreach ($flowersArr as $item) {
                $name = $item["name"];
                $desc = $item["description"];
                $price = $item["price"];
                echo("<div class='shelf-item hidden' id='shelf-$name'> // todo
                <img class='shelf-flower-img item-img' id='shelf-$name-img' src='./images/items/$name.png'>
                <div class='item-title'>$name</div>
                <div class='item-desc'>$desc</div>
                <div class='action-btn'>$price</div>
                </div>");
            }
            ?>
        </div>
    </div>

    <div id="decos-hover">
        <div id="decos-hider">
            <div id="decos">
                <span id="decos-title">🎖️   AWARDS</span>
                
            </div>
        </div>
    </div>
    <div id="expand">👷‍♀️ EXPAND GARDEN</div>
   
    
    <div id="canvas-container">
        <canvas id="backdrop-cvs" class="prerendered-cvs"></canvas>
        <canvas id="flowers-cvs" class="prerendered-cvs"></canvas>
        <canvas id="highlight-cvs" class="prerendered-cvs"></canvas>
        <canvas id="animate-cvs"></canvas>
        <canvas id="ui-cvs"></canvas>
        <div id="tile-info"></div>
    </div>

    <div id="shop-info" class="hidden"></div>

	<div id="shop">
        <div id="nav-bar">
            <input id="tools-radio" type="radio" name="nav" value="tools"checked>
            <label for="tools" class="nav-label">TOOLS</label>
            <input id="boosters-radio" type="radio" name="nav" value="boosters">
            <label for="boosters" class="nav-label">BOOSTERS</label>
            <input id="flowers-radio" type="radio" name="nav" value="flowers">
            <label for="flowers" class="nav-label">FLOWERS</label>
            <input id="buildings-radio" type="radio" name="nav" value="buildings">
            <label for="buildings" class="nav-label">BUILDINGS</label>
        </div>
        <div id="tools-header" class="shop-header">TOOLS</div>
        <?php
            foreach ($shopArrs["tools"] as $tool) {
                echo(
                    "<div class='tool-shop-item' id='tools-{$tool["name"]}'>
                    <img class='action-btn hover-content' src='./images/items/{$tool["name"]}.png'>
                    </div>"
                );
            }

            $shopSections = array("boosters", "flowers", "buildings");
            $emos = array("boosters"=>"✨", "flowers"=>"🌰", "buildings"=>"⚙️");
            foreach ($shopSections as $section) {
                echo('<div id="'.$section.'-header" class="shop-header">'.strtoupper($section).'</div>');
                $emo = $emos[$section];
                foreach ($shopArrs[$section] as $item) {
                    $name = $item["name"];
                    $desc = $item["description"];
                    $price = "<span>$emo {$item['price']} $</span>";
                    if ($section == "flowers") {
                        $plantprice = $item['price']*3;
                        $price .= "<span>🌱 $plantprice $</span>";
                    }

                    echo("<div class='shop-item $section-item' id='$section-$name'>
                            <img class='shop-img item-img hover-icon' src='./images/items/$name.png'>
                            <div class='item-content hover-content'>
                                <div class='item-title'>$name</div>
                                <div class='item-price'>$price</div>
                            </div>
                            <div class='item-buttons'>");
                        if ($section == "flowers") {
                                echo("<div class='buy-btn action-btn' data-price='{$item['price']}'>SEED</div>
                                <div class='buy-btn action-btn' data-price='$plantprice'>PLANT</div>");
                        } else if ($section == "boosters"){
                                echo("<div class='buy-btn action-btn' data-price='{$item['price']}'>APPLY</div>");
                        } else {
                            echo("<div class='buy-btn action-btn' data-price='{$item['price']}'>BUILD</div>");
                        }
                        
                    echo("</div></div>");
                    
                }
            }
            
        ?>
        
    </div>

    <div id="season-bar">
        <div id="season-marker"></div>
        <div class="skip-btn winter-skip winter-skip-left"></div>
        <div class="skip-btn spring-skip">SPRING</div>
        <div class="skip-btn summer-skip">SUMMER</div>
        <div class="skip-btn autumn-skip activeseason">AUTUMN</div>
        <div class="skip-btn winter-skip winter-skip-right">WINTER</div>
        <div class="skip-btn winter-skip winter-skip-right-left"></div>
    </div>
    <div>
        <?php
            $directory = "images";
            $images = array_merge(glob($directory . "/*.png"), glob($directory . "/*/*.png"));

            foreach($images as $image) {
                $id = basename($image, '.png');
                echo "<img id='$id' class='img' src='$image' style='display:none;'>";
            }
        ?>
    </div>
</body>
</html>