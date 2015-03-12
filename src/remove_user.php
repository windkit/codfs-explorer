<?php
	include('config.php');

	// list of user which is successful deleted or failed to delete
	$name = $_POST['name'];
	// array of uses removed successfully
	$succ = array();
	// array of user failed to remove
	$fail = array();
	$db_handle = db_login();
	
	foreach($name as $user)
	{
		$stmt = $db_handle->prepare('DELETE FROM users WHERE name=?');	
		if($stmt->execute(array($user)) === true)
		{
			array_push($succ, $user);
			// remove the user history table
			$_stmt = $db_handle->prepare("DROP TABLE `$user`");
			$_stmt->execute();
		}
		else
			array_push($fail, $user);
	}	// end of foreach
	
	echo json_encode(array('succ' => $succ, 'fail' => $fail));
?>
