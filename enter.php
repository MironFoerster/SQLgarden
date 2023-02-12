<?php
    $gamename = $_REQUEST["gamename"];
    if ($_REQUEST["gamechoice"] == "new-game") {
        $pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');
        
        $pdostmt = $pdo->query('SELECT * from flowers ORDER BY flowers.price ASC');
        $flowersArr = $pdostmt->fetchAll(PDO::FETCH_ASSOC);

        $initShelf = json_encode(array_fill_keys(array_map(function($flower) {return $flower["name"];}, $flowersArr), 0));
        $pdostmt = $pdo->prepare('INSERT INTO games (name, money, elapsedweeks, shelf) VALUES (:name, 100, 0, :shelf)');
        $pdostmt->execute(array('name'=>$gamename,
                                'shelf'=>$initShelf));

        $pdostmt = $pdo->prepare('INSERT INTO tiles (q, r, gamename, flowername, deconame, decorank, boosts, buildings, infections, age) VALUES (:q, :r, :gamename, null, :deconame, :decorank, :boosts, "{}", "{}", 0)');
        $initCoords = array(
            array(0, 0),
            array(0, -1),
            array(1, -1),
            array(1, 0),
            array(0, 1),
            array(-1, 1),
            array(-1, 0),
        );
        foreach ($initCoords as $coord) {

            $initBoosts = json_encode(
                array("water"=>rand(21, 40), "fertilizer"=>0, "compost"=>rand(21, 40), "manure"=>0, "mulch"=>rand(21, 40), "slugkiller"=>0, "bugkiler"=>0)
            );
            
            if ($coord[0] == 0 && $coord[1] == 0) {
                $deconame = "stone"; $decorank = 1;
            } else {
                $deconame = null; $decorank = 0;
            }
            $pdostmt->execute(array('q'=>$coord[0],
                                    'r'=>$coord[1],
                                    'gamename'=>$gamename,
                                    'deconame'=>$deconame,
                                    'decorank'=>$decorank,
                                    'boosts'=>$initBoosts));
        }
    }
    header("Location: garden.php?gamename=$gamename");
    exit();
?>