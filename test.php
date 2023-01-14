<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([ 'a', 'b', 'c' ]);
$server_name='localhost';
$username='root';
$password='';
$database_name='sqlgarden';

$conn=mysqli_connect($server_name,$username,$password,$database_name);
if (!$conn) {
   die('Connection failed');
}
?>