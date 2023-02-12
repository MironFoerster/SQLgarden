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
            $gamename = $_REQUEST["gamename"];
            $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');
            
            $pdostmt = $pdo->prepare('SELECT * from games WHERE name = ?');
            $pdostmt->execute(array($gamename));
            $gamestateArr = $pdostmt->fetch(PDO::FETCH_ASSOC);

            if (!$gamestateArr) {
                header("Location: index.php");
                exit();
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
                    $pdostmt = $pdo->query('SELECT * from tools ORDER BY tools.sort ASC');
                    $toolsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["tools"] = $toolsArr;
                    echo json_encode($toolsArr);
                ?>,

            boosts:
                <?php
                    $pdostmt = $pdo->query('SELECT * from boosts ORDER BY boosts.price ASC');
                    $boostsArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);
                    $shopArrs["boosts"] = $boostsArr;
                    echo json_encode($boostsArr);
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

        
        let game_data = {
            tiles:
                <?php
                    $pdostmt = $pdo->prepare('SELECT * from tiles WHERE gamename = ?');
                    $pdostmt->execute(array($gamename));
                    $tilesArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);

                    $tilesArr = array_map(function($tile) {$tile["boosts"] = json_decode($tile["boosts"]);
                                                           $tile["buildings"] = json_decode($tile["buildings"]);
                                                           $tile["infections"] = json_decode($tile["infections"]); return $tile;}, $tilesArr);
                    echo json_encode($tilesArr);
                ?>,

            ...<?php                
                $gamestateArr["money"] = intval($gamestateArr["money"]);
                $gamestateArr["elapsedweeks"] = intval($gamestateArr["elapsedweeks"]);
                $gamestateArr["shelf"] = json_decode($gamestateArr["shelf"]);
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
            foreach ($gamestateArr["shelf"] as $name => $amount) {
                $hidden = "hidden";
                if ($amount) {
                    $hidden = "";
                }
                echo("<div class='shelf-item $hidden'>
                <img class='shelf-item-img item-img' src='./images/items/$name.png'>
                <div class='item-title'>$name</div>
                <div class='shelf-item-amount'>$amount</div>
                <div class='action-btn' data-action='flower-$name-seed-shelf'></div>
                </div>");
            }
            ?>
        </div>
    </div>

    <div id="decos-hover">
        <div id="decos-hider">
            <div id="decos">
                <span id="decos-title">🎖️   AWARDS</span>
                <?php
                    foreach ($decosArr as $deco) {
                        $name = $deco["name"];
                        $task = $deco["task"];
                        $effect = $deco["effect"];
                        echo("
                        <div id='deco-$name' class='deco-item'>
                            <img src='./images/items/$name.png'>
                            <div class='progress-bar'><span>75/100</span></div>
                            <div class='place-deco-btn action-btn hidden' data-action='deco-$name'>PLACE</div>
                            
                            <div class='deco-tooltip'>
                                
                                <div class='deco-tooltip-name'>$name</div>
                                <div class='deco-tooltip-task'>$task</div>
                                <div class='deco-tooltip-effect'>$effect</div>
                            </div>
                        </div>
                        ");                        
                         // todo where to build deco (find current rank) js
                    }
                ?>

            </div>
        </div>
    </div>
    <div id="expand" data-action="expand" class="hover-icon action-btn">👷‍♀️ EXPAND GARDEN</div>
   
    
    <div id="canvas-container">
        <canvas id="backdrop-cvs" class="display-cvs"></canvas>
        <canvas id="flower-cvs" class="display-cvs"></canvas>
        <canvas id="highlight-cvs" class="display-cvs"></canvas>
        <canvas id="animate-cvs" class="display-cvs"></canvas>
        <canvas id="ui-cvs"></canvas>
    </div>

    <div id="shop-info" class="hidden"></div>

	<div id="shop">
        <div id="nav-bar">
            <input id="tool-radio" type="radio" name="nav" value="tool"checked>
            <label for="tool" class="nav-label">TOOLS</label>
            <input id="boost-radio" type="radio" name="nav" value="boost">
            <label for="boost" class="nav-label">BOOSTS</label>
            <input id="flower-radio" type="radio" name="nav" value="flower">
            <label for="flower" class="nav-label">FLOWERS</label>
            <input id="building-radio" type="radio" name="nav" value="building">
            <label for="building" class="nav-label">BUILDINGS</label>
        </div>
        <div id="tool-header" class="shop-header">TOOLS</div>
        <?php
            foreach ($shopArrs["tools"] as $tool) {
                $name = $tool["name"];
                $spadedig = ($name == "spade") ? "-dig" : "";
                echo("
                    <img class='action-btn tool-item' id='tool-$name' data-action='tool-$name$spadedig' src='./images/items/$name.png'>
                ");
            }

            $shopSections = array("boost", "flower", "building");
            $emos = array("boost"=>"✨", "flower"=>"🌰", "building"=>"⚙️");
            foreach ($shopSections as $section) {
                echo('<div id="'.$section.'-header" class="shop-header">'.strtoupper($section).'S</div>');
                $emo = $emos[$section];
                foreach ($shopArrs[$section."s"] as $item) {
                    $name = $item["name"];
                    $desc = $item["description"];
                    $price = "<span>$emo {$item['price']} $</span>";
                    if ($section == "flower") {
                        $plantprice = $item['price']*3;
                        $price .= "<span>🌱 $plantprice $</span>";
                    }

                    echo("<div class='shop-item $section-item'>
                            <img class='shop-img item-img hover-icon' data-action='$section-$name' src='./images/items/$name.png'>
                            <div class='item-content hover-content' data-action='$section-$name'>
                                <div class='item-title'>$name</div>
                                <div class='item-price'>$price</div>
                                <div id='$section-$name-info' class='item-info hidden'>
                                    insert info here
                                </div>
                            </div>
                            <div class='item-buttons'>");
                        if ($section == "flower") {
                                echo("<div class='buy-btn action-btn' data-action='flower-$name-seed' data-price='{$item['price']}'>SEED</div>
                                <div class='buy-btn action-btn' data-action='flower-$name-plant' data-price='$plantprice'>PLANT</div>");
                        } else if ($section == "boost"){
                                echo("<div class='buy-btn action-btn' data-action='boost-$name' data-price='{$item['price']}'>APPLY</div>");
                        } else if ($section == "building") {
                            echo("<div class='buy-btn action-btn' data-action='building-$name' data-price='{$item['price']}'>BUILD</div>");
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
    <div id="popup-overlay"  class="hidden" onclick="event.currentTarget.classList.add('hidden')">
            <div id="cvs-popup">
            </div>
        </div>
</body>
</html>