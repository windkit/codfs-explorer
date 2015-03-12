<?php
	/**
	 * Rename files and directories
	 */
	include("config.php");
	$old_name  = $_POST["old_name"];
	$new_name = $_POST["new_name"];
	// path of the file relative to the client store file in codfs
	$curr_rpath = $_POST['curr_rpath'];

	// absolute path of the file to be stored
	$des_dir = $des_dir . $curr_rpath . '/';
	// check if the request file exist
	if(!file_exists($des_dir . $old_name))
	{
		$ret = 1;
		$msg = "File: $old_name does not exist";
	}
	else if(file_exists($des_dir . $new_name))  // check if there is name collision for the file name
		 {
	 		$ret = 2;
			$msg = "File: $new_name already exist";
		 }
		 else
		 {
			// do the rename
		 	if(rename($des_dir . $old_name, $des_dir . $new_name))
			{
				$ret = 0;
				$msg = "success";

				add_log(db_login(), $_COOKIE['user'], "Rename file $old_name to $new_name");
			}
			else
			{
				$ret = -1;
				$msg = "Failed to rename";
			}
		 }

	echo json_encode(array("ret_no"=>$ret, "msg"=>$msg));
?>
