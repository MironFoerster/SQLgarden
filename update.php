<?php
header('Content-Type: application/json; charset=utf-8');
echo '["geeks", "for", "geeks"]';

$pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');

//print_r(json_decode($_REQUEST['rows'], associative:true)[0]["a"]);

switch ($_REQUEST["tablename"]) {
  case "awarded":
    $deletepdostmt = $pdo->prepare('DELETE FROM awarded WHERE awardname = :awardname AND gamename = :gamename');
    $insertpdostmt = $pdo->prepare('INSERT INTO awarded (awardname, gamename) VALUES (:awardname, :gamename)');
    break;
  case "tiles":
    $deletepdostmt = $pdo->prepare('DELETE FROM tiles WHERE locx = :locx AND locy = :locy AND gamename = :gamename AND (:flowername=:flowername AND :boosters=:boosters AND :planttime=:planttime AND :invdeathprob=:invdeathprob AND :invseedingprob=:invseedingprob AND :invgermingprob=:invgermingprob AND :invbugsprob=:invbugsprob AND :invsnailsprob=:invsnailsprob AND :salesvalue=:salesvalue)');
    $insertpdostmt = $pdo->prepare('INSERT INTO tiles (locx, locy, gamename, flowername, boosters, planttime, invdeathprob, invseedingprob, invgermingprob, invbugsprob, invsnailsprob, salesvalue) VALUES (:locx, :locy, :gamename, :flowername, :boosters, :planttime, :invdeathprob, :invseedingprob, :invgermingprob, :invbugsprob, :invsnailsprob, :salesvalue)');
    break;
  case "builts":
    $deletepdostmt = $pdo->prepare('DELETE FROM builts WHERE buildingname = :buildingname AND gamename = :gamename AND origx = :origx AND origy = :origy');
    $insertpdostmt = $pdo->prepare('INSERT INTO builts (buildingname, gamename, origx, origy) VALUES (:buildingname, :gamename, :origx, :origy)');
    break;
  case "games":
    $deletepdostmt = $pdo->prepare('DELETE FROM games WHERE name = :name AND (:money=:money AND :elapsedtime=:elapsedtime)');
    $insertpdostmt = $pdo->prepare('INSERT INTO games (name, money, elapsedtime) VALUES (:name, :money, :elapsedtime)');
    break;
  case "shelf":
    $deletepdostmt = $pdo->prepare('DELETE FROM shelf WHERE flowername = :flowername AND gamename = :gamename AND (:count=:count)');
    $insertpdostmt = $pdo->prepare('INSERT INTO shelf (flowername, gamename, count) VALUES (:flowername, :gamename, :count)');
}

foreach (json_decode($_REQUEST['rows'], associative:true) as $row) {
  $deletepdostmt->execute($row);
  if (!$_REQUEST['del']) {
    $insertpdostmt->execute($row);
  }
}

?>