<?php

$server_name='localhost';
$username='root';
$password='';
$database_name='sqlgarden';

$conn=mysqli_connect($server_name,$username,$password,$database_name);
if (!$conn) {
   die('Connection failed');
}
foreach ($_REQUEST['data'] as $row) {
  switch ($_REQUEST["table_name"]) {
    case "awards":
      break;
    case "tiles":
      $sql = "
      IF EXISTS (SELECT 1 FROM".$_REQUEST['table_name']."WHERE UniqueColumn = 'Something')
      BEGIN
          UPDATE Tbl 
          SET ...
          WHERE UniqueColumn = 'Something';
      END
      ELSE
      BEGIN
          INSERT INTO Tbl
          SELECT ...
      END";
      break;
    case "builts":
      break;
    case "gamestates":
      break;
    default:
      
  }
  $result=mysqli_query($conn, $sql);
}

echo '["updated"]';
?>