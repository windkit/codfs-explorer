<?php
	/**
	 * Receive ajax request and send back the user history table with raw html table data
	 */
	include('config.php');
	$user = $_COOKIE['user'];
	$session = $_COOKIE['sess'];
	if(check_session($user, $session) !== true)
		exit();

	// Get all the action in database
	$db_handle = db_login();
	$stmt = $db_handle->prepare("SELECT time, log FROM $user ORDER BY id ASC");
	$stmt->execute();

// return the html content
echo <<<EOF
	<table class="table table-striped table-hover table-bordered">
		<thead>
			<tr>
				<th>Time</th>
				<th>Action</th>
			</tr>
		</thead>
		<tbody>
EOF;
	while($ret = $stmt->fetch(PDO::FETCH_ASSOC))
	{
		$time = date('d-m-Y H:i:s', $ret['time']);
		echo "<tr><td>$time</td>";
		echo "<td>${ret['log']}</td></tr>";
	}

echo <<<EOF
	</tbody>
	</table>
EOF;

?>

