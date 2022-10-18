<?php

$server_name='localhost';
$username='root';
$password='';
$database_name='sqlgarden';

$conn=mysqli_connect($server_name,$username,$password,$database_name);
if (!$conn) {
   die('Connection failed: ' . $conn->connect_error);
 }
 $sql = 'SELECT * from flowers;';
 $result=mysqli_query($conn, $sql);
 $newArr = array();
 while ($db_field = mysqli_fetch_assoc($result)) {
   $newArr[] = $db_field;
}
echo json_encode($newArr);
?>