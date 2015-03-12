<?php
	/**
	 * Validates session token provided by user with the database
	 */
	include('config.php');
	$username = $_COOKIE['user'];
	$session = $_COOKIE['sess'];

	if(check_session($username, $session) === true)
		$valid = 0;
	else
		$valid = 1;

	echo json_encode(array('valid' => $valid));
?>
