<?php
header('Content-Type: application/json; charset=utf-8');
$pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');

$request = json_decode(file_get_contents('php://input'), associative:true);
$deletepdostmt = null;
$insertpdostmt = null;
switch ($request["tablename"]) {  
  case "awarded":
    $deletepdostmt = $pdo->prepare('DELETE FROM awarded WHERE awardname = :awardname AND gamename = :gamename');
    $updatepdostmt = $pdo->prepare('UPDATE awarded SET awardname=:awardname, gamename=:gamename) WHERE awardname = :awardname AND gamename = :gamename');
    $insertpdostmt = $pdo->prepare('INSERT INTO awarded (awardname, gamename) VALUES (:awardname, :gamename)');
    break;
  case "tiles":
    $deletepdostmt = $pdo->prepare('DELETE FROM tiles WHERE q = :q AND r = :r AND gamename = :gamename AND (:flowername=:flowername AND :boosters=:boosters AND :planttime=:planttime AND :invdeathprob=:invdeathprob AND :invseedingprob=:invseedingprob AND :invgermingprob=:invgermingprob AND :invbugsprob=:invbugsprob AND :invsnailsprob=:invsnailsprob AND :salesvalue=:salesvalue)');
    $updatepdostmt = $pdo->prepare('UPDATE tiles SET (q, r, gamename, flowername, boosters, planttime, invdeathprob, invseedingprob, invgermingprob, invbugsprob, invsnailsprob, salesvalue) VALUES (:q, :r, :gamename, :flowername, :boosters, :planttime, :invdeathprob, :invseedingprob, :invgermingprob, :invbugsprob, :invsnailsprob, :salesvalue) ');
    $insertpdostmt = $pdo->prepare('INSERT INTO tiles (q, r, gamename, flowername, boosters, planttime, invdeathprob, invseedingprob, invgermingprob, invbugsprob, invsnailsprob, salesvalue) VALUES (:q, :r, :gamename, :flowername, :boosters, :planttime, :invdeathprob, :invseedingprob, :invgermingprob, :invbugsprob, :invsnailsprob, :salesvalue)');
    break;
  case "builts":
    $deletepdostmt = $pdo->prepare('DELETE FROM builts WHERE buildingname = :buildingname AND gamename = :gamename AND origq = :origq AND origr = :origr');
    $updatepdostmt = $pdo->prepare('UPDATE builts SET buildingname=:buildingname, gamename=:gamename, origq=:origq, origr=:origr WHERE buildingname = :buildingname AND gamename = :gamename AND origq = :origq AND origr = :origr');
    $insertpdostmt = $pdo->prepare('INSERT INTO builts (buildingname, gamename, origq, origr) VALUES (:buildingname, :gamename, :origq, :origr)');
    break;
  case "games":
    $deletepdostmt = $pdo->prepare('DELETE FROM games WHERE name = :name AND (:money=:money AND :elapsedweeks=:elapsedweeks)');
    $updatepdostmt = $pdo->prepare('UPDATE games SET name=:name, money=:money, elapsedweeks=:elapsedweeks WHERE name = :name AND (:money=:money AND :elapsedweeks=:elapsedweeks)');
    $insertpdostmt = $pdo->prepare('INSERT INTO games (name, money, elapsedweeks) VALUES (:name, :money, :elapsedweeks)');
    break;
  case "shelf":
    $deletepdostmt = $pdo->prepare('DELETE FROM shelf WHERE flowername = :flowername AND gamename = :gamename AND (:count=:count)');
    $updatepdostmt = $pdo->prepare('UPDATE shelf SET flowername=:flowername, gamename=:gamename, count=:count WHERE flowername = :flowername AND gamename = :gamename AND (:count=:count)');
    $insertpdostmt = $pdo->prepare('INSERT INTO shelf (flowername, gamename, count) VALUES (:flowername, :gamename, :count)');
}

foreach ($request['rows'] as $row) {
  switch ($request['action']) {
    case "del":
      $deletepdostmt->execute($row);
    case "ins":
      $insertpdostmt->execute($row);
    case "upd":
      $updatepdostmt->execute($row);
  }
}
echo '{"success": true}'
?>