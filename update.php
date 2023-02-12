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
    $deletepdostmt = $pdo->prepare('DELETE FROM tiles WHERE q = :q AND r = :r AND gamename = :gamename AND (:flowername=:flowername AND :deconame=:deconame AND :decorank=:decorank AND :boosts=:boosts AND :buildings=:buildings AND :infections=:infections AND :age=:age)');
    $updatepdostmt = $pdo->prepare('UPDATE tiles SET q=:q, r=:r, gamename=:gamename, flowername=:flowername, deconame=:deconame, decorank=:decorank, boosts=:boosts, buildings=:buildings, infections=:infections, age=:age WHERE q = :q AND r = :r AND gamename = :gamename');
    $insertpdostmt = $pdo->prepare('INSERT INTO tiles (q, r, gamename, flowername, deconame, decorank, boosts, buildings, infections, age) VALUES (:q, :r, :gamename, :flowername, :deconame, :decorank, :boosts, :buildings, :infections, :age)');
    break;
  case "builts":
    $deletepdostmt = $pdo->prepare('DELETE FROM builts WHERE buildingname = :buildingname AND gamename = :gamename AND origq = :origq AND origr = :origr');
    $updatepdostmt = $pdo->prepare('UPDATE builts SET buildingname=:buildingname, gamename=:gamename, origq=:origq, origr=:origr WHERE buildingname = :buildingname AND gamename = :gamename AND origq = :origq AND origr = :origr');
    $insertpdostmt = $pdo->prepare('INSERT INTO builts (buildingname, gamename, origq, origr) VALUES (:buildingname, :gamename, :origq, :origr)');
    break;
  case "games":
    $deletepdostmt = $pdo->prepare('DELETE FROM games WHERE name = :name AND (:money=:money AND :elapsedweeks=:elapsedweeks)');
    $updatepdostmt = $pdo->prepare('UPDATE games SET name=:name, money=:money, elapsedweeks=:elapsedweeks, shelf=:shelf WHERE name = :name');
    $insertpdostmt = $pdo->prepare('INSERT INTO games (name, money, elapsedweeks) VALUES (:name, :money, :elapsedweeks)');
    break;
  case "shelf":
    $deletepdostmt = $pdo->prepare('DELETE FROM shelf WHERE flowername = :flowername AND gamename = :gamename AND (:count=:count)');
    $updatepdostmt = $pdo->prepare('UPDATE shelf SET flowername=:flowername, gamename=:gamename, count=:count WHERE flowername = :flowername AND gamename = :gamename');
    $insertpdostmt = $pdo->prepare('INSERT INTO shelf (flowername, gamename, count) VALUES (:flowername, :gamename, :count)');
    break;
}

foreach ($request['rows'] as $row) {
  switch ($request["tablename"]) {
    case "games":
      $row["shelf"] = json_encode($row["shelf"]);
      break;
    case "tiles":
      $row["boosts"] = json_encode($row["boosts"]);
      $row["buildings"] = json_encode($row["buildings"], JSON_FORCE_OBJECT);
      $row["infections"] = json_encode($row["infections"], JSON_FORCE_OBJECT);
      break;
  }

  switch ($request['action']) {
    case "del":
      $deletepdostmt->execute($row);
    case "ins":
      $insertpdostmt->execute($row);
    case "upd":
      $updatepdostmt->execute($row);
  }
}
echo '{"success": true}';
?>