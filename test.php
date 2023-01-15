<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([ 'a', 'b', 'c' ]);
echo "ho";
$pdo = new PDO('mysql:host=localhost;dbname=sqlgarden', 'root', '');
$pdostmt = $pdo->prepare('SELECT * FROM games WHERE name = :name AND (:money=:money AND :go=:go)');
$sucess = $pdostmt->execute(array('name'=>'mygame', 'money'=>'10', 'go'=>'10'));
echo $sucess;
print_r($pdostmt->fetchAll(PDO::FETCH_ASSOC));
?>