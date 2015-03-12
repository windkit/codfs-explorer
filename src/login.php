<?php
	/**
	 * Handle user login and give session after login
	 */
	include('config.php');

	$username = $_POST['name'];
	$passwd = $_POST['passwd'];

	$result = 0;
	$msg = 'succeed';

	print_log("user name $username passwd: $passwd wants to login");

	// find user info in database
	$db_handle = db_login();
	if(!$db_handle)
	{
		$result = -1;
		$msg = 'server error';
		goto END;
	}
	$stmt = $db_handle->prepare('SELECT * FROM users WHERE name=? and passwd=?');
	$stmt->execute(array($username, $passwd));
	$ret = $stmt->fetch(PDO::FETCH_ASSOC);

	if(!$ret)
	{
		$result = 1;
		$msg = 'user name and password not match';
	}
	else
	{
		add_log($db_handle, $username, "$username login the system");	// defined in config.php
		// set cookie and store the generate session to database
		set_sess_cookie($username, $db_handle);
	}

END:
	echo json_encode(array('result' => $result, 'msg' => $msg));
?>
