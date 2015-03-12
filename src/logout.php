<?php
	/**
	 * To remove the session record in the db server
	 */
	include('config.php');
	$username = $_COOKIE['user'];
	$session = $_COOKIE['sess'];

	// remove session from database
	$db_handle = db_login();
	$stmt = $db_handle->prepare('DELETE FROM session WHERE user=? and session=?');
	$stmt->execute(array($user, $session));

	add_log($db_handle, $user, "$user logout the system");

	// expire the user cookie
	setcookie('sess', '', 0);
	setcookie('user', '', 0);
?>
