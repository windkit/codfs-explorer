<?php
	include('config.php');

	/* username and password input by user*/
	$name = $_POST['name'];
	$passwd = $_POST['passwd'];

	// check if there is any illegal character in the user name
	if(preg_match('/[\\\\\/:?&<>"\s\'|]/', $name) == 1)
	{
		$msg = 'User name cannot contain any space and any of the characters: \\ / : ? & < > " \' |';
		$ret = 2;
		goto END;
	}

	// check if the user name is forbidden to use
	if(in_array($name, $forb_user))
	{
		$ret = 3;
		$msg = "Cannot add user '$name', please use another name";
		goto END;
	}

	$db_handle = db_login();
	// insert record on the user table
	$stmt = $db_handle->prepare('INSERT INTO users (name, passwd) VALUES (?, ?)');
	if($stmt->execute(array($name, $passwd)) === false)
	{
		$msg = "Cannot add user '$name'";
		$ret = 1;
		goto END;
	}

	// create table for the user to store his/her history
	$stmt = $db_handle->prepare("CREATE TABLE `$name` (" .
					'`id` int(32) unsigned NOT NULL AUTO_INCREMENT,' .
					'`time` int(32) unsigned NOT NULL,' .
					'`log` varchar(512) NOT NULL,' .
					'PRIMARY KEY (`id`))');
	// failed to creat the user history table
	if($stmt->execute() === false)
	{
		// remove the user record previous insert
		$stmt = $db_handle->prepare('DELETE FROM users WHERE name=?');
		$stmt->execute(array($name));

		$msg = "Cannot add user '$name'";
		$ret = 1;
		$ret = 2;
		goto END;
	}

	$msg = "Adding user $name successfully";
	$ret = 0;
END:
	echo json_encode(array('ret' => $ret, 'msg' => $msg));
?>
